// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * The character collection's TanStack Query layer, wrapping the raw HTTP calls.
 *
 * Query keys are scoped by user ID, so signing in as someone else never serves
 * the previous account's cached collection. Every mutation invalidates that key
 * rather than writing into the cache, because the server decides the stored
 * timestamps.
 *
 * `useCollection` is what a component reaches for; these are its parts.
 */

import type { Item } from '@genshin/collection-json';
import { assertCollectionDocument } from '@genshin/collection-json';
import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { deserialiseCharacter, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPut } from '@/lib/api';
import { apiGetAllItems } from '@/lib/api-collection';
import { invalidateUserQuery } from '@/lib/invalidate-user-query';
import { userScopedKey } from '@/lib/user-scoped-key';

import type { CharacterCollection } from './use-character-collection-store';

export interface MutationResult {
  characterId: CharacterId;
  entry: CollectionCharacter;
}

const charactersKey = userScopedKey('characters');

function toCharacterCollection(items: Item[]): CharacterCollection {
  const record: CharacterCollection = {};

  for (const item of items) {
    const character = deserialiseCharacter(item);
    record[character.characterId] = character;
  }

  return record;
}

function parseSingleCharacterResponse(response: unknown): MutationResult {
  assertCollectionDocument(response);
  const { items } = response.collection;
  const [item] = items;
  if (items.length !== 1 || item === undefined) {
    throw new Error(`Invalid API response: expected exactly one item, got ${items.length}`);
  }
  const character = deserialiseCharacter(item);
  return {
    characterId: character.characterId,
    entry: character,
  };
}

export function useCharacterCollectionQuery(
  userId: string | undefined,
): UseQueryResult<CharacterCollection, Error> {
  return useQuery({
    queryKey: charactersKey(userId ?? ''),
    queryFn: async () => {
      return toCharacterCollection(await apiGetAllItems('/characters'));
    },
    enabled: userId !== undefined,
  });
}

export function useAddCharacterMutation(
  userId: string | undefined,
): UseMutationResult<MutationResult, Error, CharacterId> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId): Promise<MutationResult> => {
      const response = await apiPut(`/characters/${encodeURIComponent(characterId)}`, {
        constellationLevel: MIN_CONSTELLATION_LEVEL,
      });
      return parseSingleCharacterResponse(response);
    },
    onSuccess: invalidateUserQuery(queryClient, userId, charactersKey),
  });
}

export function useRemoveCharacterMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, CharacterId> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId) => {
      await apiDelete(`/characters/${encodeURIComponent(characterId)}`);
    },
    onSuccess: invalidateUserQuery(queryClient, userId, charactersKey),
  });
}

export interface SetConstellationLevelVariables {
  characterId: CharacterId;
  level: ConstellationLevel;
}

export function useSetConstellationLevelMutation(
  userId: string | undefined,
): UseMutationResult<MutationResult, Error, SetConstellationLevelVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      characterId,
      level,
    }: SetConstellationLevelVariables): Promise<MutationResult> => {
      const response = await apiPut(`/characters/${encodeURIComponent(characterId)}`, {
        constellationLevel: level,
      });
      return parseSingleCharacterResponse(response);
    },
    onSuccess: invalidateUserQuery(queryClient, userId, charactersKey),
  });
}
