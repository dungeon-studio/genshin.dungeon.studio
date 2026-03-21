// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionDocument } from '@genshin/collection-json';
import { deserialiseCharacter, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPut } from '@/lib/api';

import type { CharacterId, CollectionEntry } from './useCollectionStore';

type CharacterRecord = Record<CharacterId, CollectionEntry>;

export interface MutationResult {
  characterId: CharacterId;
  entry: CollectionEntry;
}

export const COLLECTION_KEY = ['characters'] as const;

export function parseCollectionResponse(response: unknown): CharacterRecord {
  const doc = response as CollectionDocument;
  const record: CharacterRecord = {};

  for (const item of doc.collection.items) {
    const character = deserialiseCharacter(item);
    record[character.characterId] = { constellationLevel: character.constellationLevel };
  }

  return record;
}

function parseSingleCharacterResponse(response: unknown): MutationResult {
  const doc = response as CollectionDocument;
  const character = deserialiseCharacter(doc.collection.items[0]);
  return {
    characterId: character.characterId,
    entry: { constellationLevel: character.constellationLevel },
  };
}

export function useCharacterCollectionQuery(enabled: boolean) {
  return useQuery({
    queryKey: COLLECTION_KEY,
    queryFn: async () => {
      const response = await apiGet('/api/characters');
      return parseCollectionResponse(response);
    },
    enabled,
  });
}

export function useAddCharacterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId): Promise<MutationResult> => {
      const response = await apiPut(`/api/characters/${encodeURIComponent(characterId)}`, {
        constellationLevel: MIN_CONSTELLATION_LEVEL,
      });
      return parseSingleCharacterResponse(response);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}

export function useRemoveCharacterMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (characterId: CharacterId) => {
      await apiDelete(`/api/characters/${encodeURIComponent(characterId)}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}

export function useSetConstellationLevelMutation() {
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
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEY });
    },
  });
}
