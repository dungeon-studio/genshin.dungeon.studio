// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
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

beforeEach(() => {
  useCollectionStore.getState().clearCharacters();
  vi.clearAllMocks();
});

describe('useCollection merge-on-first-login', () => {
  it('merges the local collection into the store and syncs new entries to the server', async () => {
    // Anonymous local collection built before signing in.
    useCollectionStore.getState().addCharacter(SKIRK);
    useCollectionStore.getState().setConstellationLevel(SKIRK, 3);

    const putBodies: unknown[] = [];
    server.use(
      http.get('http://localhost:8080/characters', () => HttpResponse.json(charactersDocument([]))),
      http.put('http://localhost:8080/characters/skirk', async ({ request }) => {
        putBodies.push(await request.json());
        return HttpResponse.json(
          charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })]),
        );
      }),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    // The locally-owned character absent from the server is pushed up.
    await waitFor(() => expect(putBodies).toContainEqual({ constellationLevel: 3 }));
  });

  it('does not re-push local entries when the same user refetches', async () => {
    useCollectionStore.getState().addCharacter(SKIRK);
    useCollectionStore.getState().setConstellationLevel(SKIRK, 3);

    let getCount = 0;
    let putCount = 0;
    server.use(
      http.get('http://localhost:8080/characters', () => {
        getCount += 1;
        return HttpResponse.json(charactersDocument([]));
      }),
      http.put('http://localhost:8080/characters/skirk', () => {
        putCount += 1;
        return HttpResponse.json(
          charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })]),
        );
      }),
    );

    renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    // First merge pushes the diff, whose success invalidates and refetches.
    await waitFor(() => expect(putCount).toBe(1));
    await waitFor(() => expect(getCount).toBeGreaterThanOrEqual(2));

    // The refetch runs the additive branch, not another merge push.
    expect(putCount).toBe(1);
  });

  it('clears the collection on logout so a different user merges fresh', async () => {
    useCollectionStore.getState().addCharacter(SKIRK);
    useCollectionStore.getState().setConstellationLevel(SKIRK, 3);

    let serverCharacters = charactersDocument([]);
    server.use(
      http.get('http://localhost:8080/characters', () => HttpResponse.json(serverCharacters)),
      http.put('http://localhost:8080/characters/skirk', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })])),
      ),
    );

    const queryClient = createTestQueryClient();
    let authUser: User | null = fakeUser('user-1');
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthContext value={{ user: authUser, loading: false }}>{children}</AuthContext>
        </QueryClientProvider>
      );
    }

    const { result, rerender } = renderHook(() => useCollection(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeDefined());

    // A second account signs in.
    serverCharacters = charactersDocument([makeCharacter(ESCOFFIER, { constellationLevel: 2 })]);
    authUser = null;
    rerender();
    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeUndefined());

    authUser = fakeUser('user-2');
    rerender();

    await waitFor(() => expect(result.current.getCharacter(ESCOFFIER)?.constellationLevel).toBe(2));
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
  });
});

describe('useCollection mutations', () => {
  it('restores a removed character when the delete fails', async () => {
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })])),
      ),
      http.delete(
        'http://localhost:8080/characters/skirk',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));

    act(() => {
      result.current.removeCharacter(SKIRK);
    });

    // Optimistically gone, then restored at its prior level once the delete errors.
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });
});
