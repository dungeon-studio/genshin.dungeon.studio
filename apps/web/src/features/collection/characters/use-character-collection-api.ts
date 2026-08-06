// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { deserialiseCharacter, MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
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

// The API has no separate add: ownership is a PUT of a constellation level.
async function putCharacter(characterId: CharacterId, level: number): Promise<MutationResult> {
  const response = await apiPut(`/api/characters/${encodeURIComponent(characterId)}`, {
    constellationLevel: level,
  });
  return parseSingleCharacterResponse(response);
}

function withCharacter(
  current: CharacterRecord,
  characterId: CharacterId,
  level: number,
): CharacterRecord {
  const now = nowTimestamp();
  const entry = current[characterId];

  return {
    ...current,
    [characterId]: entry
      ? { ...entry, constellationLevel: level, updatedAt: now }
      : { characterId, constellationLevel: level, createdAt: now, updatedAt: now },
  };
}

function withoutCharacter(current: CharacterRecord, characterId: CharacterId): CharacterRecord {
  const next = { ...current };
  delete next[characterId];
  return next;
}

// Callers supply only the request and the cache edit. Invalidation is on
// settled rather than success so a rolled-back failure refetches too.
function useCollectionMutation<TVariables, TResult>(
  userId: string | undefined,
  mutationFn: (variables: TVariables) => Promise<TResult>,
  optimistic: (current: CharacterRecord, variables: TVariables) => CharacterRecord,
): UseMutationResult<TResult, Error, TVariables, CharacterRecord | undefined> {
  const queryClient = useQueryClient();
  const queryKey = collectionKey(userId ?? '');

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // A resolving GET would otherwise land on top of the optimistic write.
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CharacterRecord>(queryKey);
      queryClient.setQueryData<CharacterRecord>(queryKey, optimistic(previous ?? {}, variables));
      return previous;
    },
    // TanStack hands back whatever onMutate returned. An undefined snapshot
    // leaves the cache alone, so an optimistic write over an unloaded
    // collection is corrected by the invalidation below rather than here.
    onError: (_error, _variables, previous) => {
      queryClient.setQueryData<CharacterRecord>(queryKey, previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCharacterCollectionQuery(
  userId: string | undefined,
): UseQueryResult<CharacterRecord, Error> {
  return useQuery({
    queryKey: collectionKey(userId ?? ''),
    queryFn: async () => {
      const response = await apiGet('/api/characters');
      return parseCollectionResponse(response);
    },
    enabled: userId !== undefined,
  });
}

export function useAddCharacterMutation(
  userId: string | undefined,
): UseMutationResult<MutationResult, Error, CharacterId, CharacterRecord | undefined> {
  return useCollectionMutation(
    userId,
    (characterId: CharacterId) => putCharacter(characterId, MIN_CONSTELLATION_LEVEL),
    (current, characterId) => withCharacter(current, characterId, MIN_CONSTELLATION_LEVEL),
  );
}

export function useRemoveCharacterMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, CharacterId, CharacterRecord | undefined> {
  return useCollectionMutation(
    userId,
    async (characterId: CharacterId) => {
      await apiDelete(`/api/characters/${encodeURIComponent(characterId)}`);
    },
    withoutCharacter,
  );
}

export function useSetConstellationLevelMutation(
  userId: string | undefined,
): UseMutationResult<
  MutationResult,
  Error,
  { characterId: CharacterId; level: number },
  CharacterRecord | undefined
> {
  return useCollectionMutation(
    userId,
    ({ characterId, level }: { characterId: CharacterId; level: number }) =>
      putCharacter(characterId, level),
    (current, { characterId, level }) => withCharacter(current, characterId, level),
  );
}
