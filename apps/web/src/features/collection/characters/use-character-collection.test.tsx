// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCollection } from './use-character-collection';
import { useCollectionStore } from './use-character-collection-store';

const SKIRK = 'skirk' as CharacterId;

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

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));

    act(() => {
      result.current.setConstellationLevel(SKIRK, 5);
    });

    expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(5);
    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });
});
