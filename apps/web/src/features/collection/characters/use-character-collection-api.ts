// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { deserialiseCharacter, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPut } from '@/lib/api';

type CharacterRecord = Record<CharacterId, CollectionCharacter>;

export interface MutationResult {
  characterId: CharacterId;
  entry: CollectionCharacter;
}

export function collectionKey(userId: string): readonly [string, string] {
  return ['characters', userId] as const;
}

export function parseCollectionResponse(response: unknown): CharacterRecord {
  assertCollectionDocument(response);
  const record: CharacterRecord = {};

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

export function useCharacterCollectionQuery(userId: string | undefined) {
  return useQuery({
    queryKey: collectionKey(userId ?? ''),
    queryFn: async () => {
      const response = await apiGet('/api/characters');
      return parseCollectionResponse(response);
    },
    enabled: userId !== undefined,
  });
}

export function useAddCharacterMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId): Promise<MutationResult> => {
      const response = await apiPut(`/api/characters/${encodeURIComponent(characterId)}`, {
        constellationLevel: MIN_CONSTELLATION_LEVEL,
      });
      return parseSingleCharacterResponse(response);
    },
    onSuccess: () => {
      if (userId !== undefined) queryClient.invalidateQueries({ queryKey: collectionKey(userId) });
    },
  });
}

export function useRemoveCharacterMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId) => {
      await apiDelete(`/api/characters/${encodeURIComponent(characterId)}`);
    },
    onSuccess: () => {
      if (userId !== undefined) queryClient.invalidateQueries({ queryKey: collectionKey(userId) });
    },
  });
}

export function useSetConstellationLevelMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      characterId,
      level,
    }: {
      characterId: CharacterId;
      level: number;
    }): Promise<MutationResult> => {
      const response = await apiPut(`/api/characters/${encodeURIComponent(characterId)}`, {
        constellationLevel: level,
      });
      return parseSingleCharacterResponse(response);
    },
    onSuccess: () => {
      if (userId !== undefined) queryClient.invalidateQueries({ queryKey: collectionKey(userId) });
    },
  });
}
