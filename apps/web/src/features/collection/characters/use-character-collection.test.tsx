// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/features/auth/auth-context';
import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createTestQueryClient, createWrapper, fakeUser } from '@/test/render';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCollection } from './use-character-collection';
import { useCollectionStore } from './use-character-collection-store';

const SKIRK = 'skirk' as CharacterId;
const ESCOFFIER = 'escoffier' as CharacterId;

// A collection that mutations actually change, so a refetch reflects what the
// preceding PUT or DELETE did. The authenticated read layer is the server, so
// stateless handlers would report every write as immediately lost.
function fakeServerCollection(initial: CollectionCharacter[] = []) {
  const characters = new Map(initial.map((character) => [character.characterId, character]));
  const requests = { get: 0, put: 0, delete: 0 };

  server.use(
    http.get('http://localhost:8080/api/characters', () => {
      requests.get += 1;
      return HttpResponse.json(charactersDocument([...characters.values()]));
    }),
    http.put('http://localhost:8080/api/characters/:characterId', async ({ params, request }) => {
      requests.put += 1;
      const { constellationLevel } = (await request.json()) as { constellationLevel: number };
      const entry = makeCharacter(params.characterId as string, constellationLevel);
      characters.set(entry.characterId, entry);
      return HttpResponse.json(charactersDocument([entry]));
    }),
    http.delete('http://localhost:8080/api/characters/:characterId', ({ params }) => {
      requests.delete += 1;
      characters.delete(params.characterId as CharacterId);
      return new HttpResponse(null, { status: 204 });
    }),
  );

  return { characters, requests };
}

beforeEach(() => {
  useCollectionStore.getState().clearCharacters();
  vi.clearAllMocks();
});

describe('useCollection anonymous', () => {
  it('writes to the local store without touching the API', async () => {
    const api = fakeServerCollection();

    const { result } = renderHook(() => useCollection(), { wrapper: createWrapper() });

    act(() => {
      result.current.addCharacter(SKIRK);
    });
    act(() => {
      result.current.setConstellationLevel(SKIRK, 2);
    });

    expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(2);
    expect(useCollectionStore.getState().characters[SKIRK]?.constellationLevel).toBe(2);
    expect(api.requests).toEqual({ get: 0, put: 0, delete: 0 });
  });

  it('keeps the persisted collection when auth resolves to signed-out', async () => {
    useCollectionStore.getState().addCharacter(SKIRK);

    let loading = true;
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={createTestQueryClient()}>
          <AuthContext.Provider value={{ user: null, loading }}>{children}</AuthContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result, rerender } = renderHook(() => useCollection(), { wrapper: Wrapper });

    act(() => {
      loading = false;
      rerender();
    });

    expect(result.current.getCharacter(SKIRK)).toBeDefined();
  });
});

describe('useCollection merge-on-first-login', () => {
  it('pushes the local collection to the server, then empties the local store', async () => {
    // Anonymous local collection built before signing in.
    useCollectionStore.getState().addCharacter(SKIRK);
    useCollectionStore.getState().setConstellationLevel(SKIRK, 3);

    const api = fakeServerCollection();

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(api.characters.get(SKIRK)?.constellationLevel).toBe(3);
    await waitFor(() => expect(useCollectionStore.getState().characters).toEqual({}));
  });

  it('does not re-push local entries when the same user refetches', async () => {
    useCollectionStore.getState().addCharacter(SKIRK);
    useCollectionStore.getState().setConstellationLevel(SKIRK, 3);

    const api = fakeServerCollection();

    renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    // The merge push settles and invalidates, which refetches.
    await waitFor(() => expect(api.requests.put).toBe(1));
    await waitFor(() => expect(api.requests.get).toBeGreaterThanOrEqual(2));

    // The refetch is a plain read, not another merge.
    expect(api.requests.put).toBe(1);
  });

  it('drops local data on sign-out so a different account merges fresh', async () => {
    useCollectionStore.getState().addCharacter(SKIRK);
    useCollectionStore.getState().setConstellationLevel(SKIRK, 3);

    const api = fakeServerCollection();

    const queryClient = createTestQueryClient();
    let authUser: User | null = fakeUser('user-1');
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={{ user: authUser, loading: false }}>
            {children}
          </AuthContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result, rerender } = renderHook(() => useCollection(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeDefined());
    await waitFor(() => expect(useCollectionStore.getState().characters).toEqual({}));

    act(() => {
      authUser = null;
      rerender();
    });
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();

    // A second account signs in against its own server collection.
    api.characters.clear();
    api.characters.set(ESCOFFIER, makeCharacter(ESCOFFIER, 2));
    act(() => {
      authUser = fakeUser('user-2');
      rerender();
    });

    await waitFor(() => expect(result.current.getCharacter(ESCOFFIER)?.constellationLevel).toBe(2));
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
    expect(api.characters.has(SKIRK)).toBe(false);
  });
});

describe('useCollection authenticated mutations', () => {
  it('removes optimistically and restores the entry when the delete fails', async () => {
    fakeServerCollection([makeCharacter(SKIRK, 3)]);

    let releaseDelete!: () => void;
    const deleteInFlight = new Promise<void>((resolve) => {
      releaseDelete = resolve;
    });
    server.use(
      http.delete('http://localhost:8080/api/characters/skirk', async () => {
        await deleteInFlight;
        return new HttpResponse(null, { status: 500 });
      }),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));

    act(() => {
      result.current.removeCharacter(SKIRK);
    });
    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeUndefined());

    act(() => {
      releaseDelete();
    });
    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });

  it('raises the constellation level optimistically before the server confirms', async () => {
    fakeServerCollection([makeCharacter(SKIRK, 1)]);

    let releasePut!: () => void;
    const putInFlight = new Promise<void>((resolve) => {
      releasePut = resolve;
    });
    server.use(
      http.put('http://localhost:8080/api/characters/skirk', async () => {
        await putInFlight;
        return HttpResponse.json(charactersDocument([makeCharacter(SKIRK, 4)]));
      }),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(1));

    act(() => {
      result.current.setConstellationLevel(SKIRK, 4);
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(4));
    expect(useCollectionStore.getState().characters[SKIRK]).toBeUndefined();

    act(() => {
      releasePut();
    });
  });
});
