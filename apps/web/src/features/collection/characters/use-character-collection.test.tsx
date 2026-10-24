// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { holdResponse } from '@/test/msw/held-response';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser, renderHookSignedIn } from '@/test/render';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCollection } from './use-character-collection';
import { useCollectionStore } from './use-character-collection-store';

const SKIRK = 'skirk' as CharacterId;

beforeEach(() => {
  localStorage.clear();
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

  it('does not re-add a character removed elsewhere when the hook mounts again', async () => {
    let serverCharacters = [makeCharacter(SKIRK, { constellationLevel: 3 })];
    let putCount = 0;
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument(serverCharacters)),
      ),
      http.put('http://localhost:8080/characters/skirk', () => {
        putCount += 1;
        return HttpResponse.json(charactersDocument(serverCharacters));
      }),
    );

    const { result: firstMount, unmount } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });
    await waitFor(() => expect(firstMount.current.isOwned(SKIRK)).toBe(true));
    unmount();

    // Another device removes the character while this one still holds it.
    serverCharacters = [];

    const { result: secondMount } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });
    await waitFor(() => expect(secondMount.current.isLoading).toBe(false));

    expect(putCount).toBe(0);
  });

  it('pushes local entries again after the user signs out and back in', async () => {
    let putCount = 0;
    server.use(
      http.get('http://localhost:8080/characters', () => HttpResponse.json(charactersDocument([]))),
      http.put('http://localhost:8080/characters/skirk', () => {
        putCount += 1;
        return HttpResponse.json(
          charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })]),
        );
      }),
    );

    useCollectionStore.getState().addCharacter(SKIRK);
    const { signOut, unmount } = renderHookSignedIn(() => useCollection(), 'user-1');
    await waitFor(() => expect(putCount).toBe(1));
    signOut();
    unmount();

    // A visitor's addition made signed out has to reach the account on sign-in.
    useCollectionStore.getState().addCharacter(SKIRK);
    renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(putCount).toBe(2));
  });
});

describe('useCollection mutations', () => {
  async function renderOwningSkirkAtC3() {
    const view = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });
    await waitFor(() =>
      expect(view.result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3),
    );
    return view;
  }

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

    const { result } = await renderOwningSkirkAtC3();

    act(() => {
      result.current.removeCharacter(SKIRK);
    });

    // Optimistically gone, then restored at its prior level once the delete errors.
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });

  it('stores the saved character with the server timestamps', async () => {
    const saved = makeCharacter(SKIRK, { constellationLevel: 5 });
    let getCount = 0;
    server.use(
      http.get('http://localhost:8080/characters', () => {
        getCount += 1;
        // Hold the post-save refetch so only the mutation result can reach the store.
        if (getCount > 1) return new Promise<never>(() => {});
        return HttpResponse.json(
          charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })]),
        );
      }),
      http.put('http://localhost:8080/characters/skirk', () =>
        HttpResponse.json(charactersDocument([saved])),
      ),
    );

    const { result } = await renderOwningSkirkAtC3();

    act(() => {
      result.current.setConstellationLevel(SKIRK, 5);
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toEqual(saved));
  });

  it('restores the prior constellation level when the update fails', async () => {
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })])),
      ),
      http.put(
        'http://localhost:8080/characters/skirk',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = await renderOwningSkirkAtC3();

    act(() => {
      result.current.setConstellationLevel(SKIRK, 5);
    });

    expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(5);
    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });

  it('leaves the store alone when a removal fails after sign-out', async () => {
    const deleteFailure = holdResponse(() => new HttpResponse(null, { status: 500 }));
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK, { constellationLevel: 3 })])),
      ),
      http.delete('http://localhost:8080/characters/skirk', deleteFailure.resolver),
    );

    const { result, queryClient, signOut } = renderHookSignedIn(() => useCollection(), 'user-1');
    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeDefined());

    act(() => {
      result.current.removeCharacter(SKIRK);
    });
    signOut();
    await waitFor(() => expect(queryClient.isMutating()).toBe(1));
    deleteFailure.release();

    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(useCollectionStore.getState().characters[SKIRK]).toBeUndefined();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
