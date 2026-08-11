// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { deserialiseCharacter, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPut } from '@/lib/api';
import { invalidateUserQuery } from '@/lib/invalidate-user-query';

import type { CharacterCollection } from './use-character-collection-store';

export interface MutationResult {
  characterId: CharacterId;
  entry: CollectionCharacter;
}

function collectionKey(userId: string): readonly [string, string] {
  return ['characters', userId] as const;
}

function parseCollectionResponse(response: unknown): CharacterCollection {
  assertCollectionDocument(response);
  const record: CharacterCollection = {};

  for (const item of response.collection.items) {
    const character = deserialiseCharacter(item);
    record[character.characterId] = character;
  }

  return record;
}

function parseSingleCharacterResponse(response: unknown): MutationResult {
  assertCollectionDocument(response);
  if (response.collection.items.length !== 1) {
    throw new Error(
      `Invalid API response: expected exactly one item, got ${response.collection.items.length}`,
    );
  }
  const character = deserialiseCharacter(response.collection.items[0]);
  return {
    characterId: character.characterId,
    entry: character,
  };
}

export function useCharacterCollectionQuery(
  userId: string | undefined,
): UseQueryResult<CharacterCollection, Error> {
  return useQuery({
    queryKey: collectionKey(userId ?? ''),
    queryFn: async () => {
      const response = await apiGet('/characters');
      return parseCollectionResponse(response);
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
    onSuccess: invalidateUserQuery(queryClient, userId, collectionKey),
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
    onSuccess: invalidateUserQuery(queryClient, userId, collectionKey),
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
    onSuccess: invalidateUserQuery(queryClient, userId, collectionKey),
  });
}
