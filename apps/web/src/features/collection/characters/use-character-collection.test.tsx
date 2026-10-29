// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { holdResponse } from '@/test/msw/held-response';
import { matchJsonBody } from '@/test/msw/match-json-body';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser, renderHookSignedIn } from '@/test/render';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCollection } from './use-character-collection';
import { useCollectionStore } from './use-character-collection-store';

const SKIRK = 'skirk' as CharacterId;

interface CharacterLevelBody {
  constellationLevel: number;
}

/** A fake API whose list answers with what its successful writes left behind. */
function fakeCharacterServer(initial: CollectionCharacter[]) {
  let stored = initial;
  const without = (id: CharacterId) => stored.filter((c) => c.characterId !== id);
  return {
    list: http.get('http://localhost:8080/characters', () =>
      HttpResponse.json(charactersDocument(stored)),
    ),
    put: (character: CollectionCharacter) => {
      stored = [...without(character.characterId), character];
      return HttpResponse.json(charactersDocument([character]));
    },
    remove: (id: CharacterId) => {
      stored = without(id);
      return new HttpResponse(null, { status: 204 });
    },
  };
}

beforeEach(() => {
  useCollectionStore.getState().clearCharacters();
  vi.clearAllMocks();
});

describe('useCollection sync', () => {
  it('records nothing signed out', () => {
    const { result } = renderHook(() => useCollection(), { wrapper: createWrapper() });

    act(() => {
      result.current.addCharacter(SKIRK);
    });

    expect(result.current.isOwned(SKIRK)).toBe(false);
  });

  it("replaces the store with the server's collection", async () => {
    // Held from an earlier session, since removed on another device.
    useCollectionStore.getState().addCharacter(SKIRK);
    server.use(
      http.get('http://localhost:8080/characters', () => HttpResponse.json(charactersDocument([]))),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await waitFor(() => expect(result.current.isOwned(SKIRK)).toBe(false));
  });

  it('keeps a loaded collection when a later refetch fails', async () => {
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK)])),
      ),
    );
    const { result, queryClient } = renderHookSignedIn(() => useCollection(), 'user-1');
    await waitFor(() => expect(result.current.isOwned(SKIRK)).toBe(true));

    server.use(
      http.get('http://localhost:8080/characters', () => new HttpResponse(null, { status: 500 })),
    );
    await act(() => queryClient.invalidateQueries());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loadFailed).toBe(false);
    expect(result.current.isOwned(SKIRK)).toBe(true);
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
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't remove Skirk. Skirk is back in your collection. Try again.",
    );
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
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't set Skirk to constellation level 5. Skirk is back at constellation level 3. Try again.",
    );
  });

  it("returns to the server's level when two rapid level changes both fail", async () => {
    const firstFailure = holdResponse(() => new HttpResponse(null, { status: 500 }));
    const serverLevel = 3;
    const firstLevel = 4;
    const secondLevel = 5;
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(
          charactersDocument([makeCharacter(SKIRK, { constellationLevel: serverLevel })]),
        ),
      ),
      http.put(
        matchJsonBody<CharacterLevelBody>(
          'http://localhost:8080/characters/skirk',
          ({ constellationLevel }) => constellationLevel === firstLevel,
        ),
        firstFailure.resolver,
      ),
      http.put(
        'http://localhost:8080/characters/skirk',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = await renderOwningSkirkAtC3();

    act(() => {
      result.current.setConstellationLevel(SKIRK, firstLevel);
    });
    act(() => {
      result.current.setConstellationLevel(SKIRK, secondLevel);
    });
    // The second failure lands first and rolls back to the level it replaced.
    await waitFor(() =>
      expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(firstLevel),
    );
    await act(() => firstFailure.arrived);
    firstFailure.release();

    await waitFor(() =>
      expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(serverLevel),
    );
  });

  it('drops an added character when the add fails', async () => {
    server.use(
      http.get('http://localhost:8080/characters', () => HttpResponse.json(charactersDocument([]))),
      http.put(
        'http://localhost:8080/characters/skirk',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addCharacter(SKIRK);
    });

    expect(result.current.isOwned(SKIRK)).toBe(true);
    await waitFor(() => expect(result.current.isOwned(SKIRK)).toBe(false));
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't add Skirk. Skirk is out of your collection again. Try again.",
    );
  });

  it('keeps a raise made while a failing add was in flight', async () => {
    const addFailure = holdResponse(() => new HttpResponse(null, { status: 500 }));
    const raisedLevel = 3;
    const fake = fakeCharacterServer([]);
    server.use(
      fake.list,
      http.put(
        matchJsonBody<CharacterLevelBody>(
          'http://localhost:8080/characters/skirk',
          ({ constellationLevel }) => constellationLevel === MIN_CONSTELLATION_LEVEL,
        ),
        addFailure.resolver,
      ),
      http.put('http://localhost:8080/characters/skirk', () =>
        fake.put(makeCharacter(SKIRK, { constellationLevel: raisedLevel })),
      ),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addCharacter(SKIRK);
    });
    act(() => {
      result.current.setConstellationLevel(SKIRK, raisedLevel);
    });
    await act(() => addFailure.arrived);
    addFailure.release();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't add Skirk. Your newer change stands."),
    );
    expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(raisedLevel);
  });

  it('keeps a re-add made while a failing removal was in flight', async () => {
    const deleteFailure = holdResponse(() => new HttpResponse(null, { status: 500 }));
    const fake = fakeCharacterServer([makeCharacter(SKIRK, { constellationLevel: 3 })]);
    server.use(
      fake.list,
      http.delete('http://localhost:8080/characters/skirk', deleteFailure.resolver),
      http.put('http://localhost:8080/characters/skirk', () => fake.put(makeCharacter(SKIRK))),
    );

    const { result } = await renderOwningSkirkAtC3();

    act(() => {
      result.current.removeCharacter(SKIRK);
    });
    act(() => {
      result.current.addCharacter(SKIRK);
    });
    deleteFailure.release();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't remove Skirk. Your newer change stands."),
    );
    expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(0);
  });

  it('keeps a re-add made while a failing level change was in flight', async () => {
    const levelFailure = holdResponse(() => new HttpResponse(null, { status: 500 }));
    const failingLevel = 5;
    const fake = fakeCharacterServer([makeCharacter(SKIRK, { constellationLevel: 3 })]);
    const deletion = holdResponse(() => fake.remove(SKIRK));
    server.use(
      fake.list,
      http.put(
        matchJsonBody<CharacterLevelBody>(
          'http://localhost:8080/characters/skirk',
          ({ constellationLevel }) => constellationLevel === failingLevel,
        ),
        levelFailure.resolver,
      ),
      http.put('http://localhost:8080/characters/skirk', () => fake.put(makeCharacter(SKIRK))),
      http.delete('http://localhost:8080/characters/skirk', deletion.resolver),
    );

    const { result } = await renderOwningSkirkAtC3();

    act(() => {
      result.current.setConstellationLevel(SKIRK, failingLevel);
    });
    act(() => {
      result.current.removeCharacter(SKIRK);
    });
    // The server applies the removal before the re-add, as the user made them.
    await act(() => deletion.arrived);
    deletion.release();
    act(() => {
      result.current.addCharacter(SKIRK);
    });
    await act(() => levelFailure.arrived);
    levelFailure.release();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't set Skirk to constellation level 5. Your newer change stands.",
      ),
    );
    expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(0);
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
