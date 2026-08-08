// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper } from '@/test/render';

import {
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';

const USER_ID = 'user-1';
const CHARACTER = 'skirk' as CharacterId;

describe('useCharacterCollectionQuery', () => {
  it('returns the deserialised characters keyed by id', async () => {
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(CHARACTER, 2)])),
      ),
    );

    const { result } = renderHook(() => useCharacterCollectionQuery(USER_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[CHARACTER]).toEqual(
      expect.objectContaining({ characterId: CHARACTER, constellationLevel: 2 }),
    );
  });
});

describe('useAddCharacterMutation', () => {
  it('PUTs the minimum constellation level and returns the parsed entry', async () => {
    let putBody: unknown;
    server.use(
      http.put('http://localhost:8080/characters/skirk', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(charactersDocument([makeCharacter(CHARACTER, 0)]));
      }),
    );

    const { result } = renderHook(() => useAddCharacterMutation(USER_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(CHARACTER);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(putBody).toEqual({ constellationLevel: MIN_CONSTELLATION_LEVEL });
    expect(result.current.data).toEqual({
      characterId: CHARACTER,
      entry: expect.objectContaining({ characterId: CHARACTER }),
    });
  });

  it('invalidates the collection query so it refetches after adding', async () => {
    let getCount = 0;
    server.use(
      http.get('http://localhost:8080/characters', () => {
        getCount += 1;
        return HttpResponse.json(charactersDocument([]));
      }),
      http.put('http://localhost:8080/characters/skirk', () =>
        HttpResponse.json(charactersDocument([makeCharacter(CHARACTER, 0)])),
      ),
    );

    const { result } = renderHook(
      () => ({
        query: useCharacterCollectionQuery(USER_ID),
        add: useAddCharacterMutation(USER_ID),
      }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(getCount).toBe(1);

    act(() => {
      result.current.add.mutate(CHARACTER);
    });

    await waitFor(() => expect(getCount).toBe(2));
  });
});

describe('useSetConstellationLevelMutation', () => {
  it('PUTs the requested level and returns the parsed entry', async () => {
    let putBody: unknown;
    server.use(
      http.put('http://localhost:8080/characters/skirk', async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json(charactersDocument([makeCharacter(CHARACTER, 4)]));
      }),
    );

    const { result } = renderHook(() => useSetConstellationLevelMutation(USER_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ characterId: CHARACTER, level: 4 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(putBody).toEqual({ constellationLevel: 4 });
    expect(result.current.data?.entry.constellationLevel).toBe(4);
  });
});
