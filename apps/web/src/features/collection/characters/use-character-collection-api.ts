// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { deserialiseCharacter, MIN_CONSTELLATION_LEVEL, nowTimestamp } from '@genshin/domain';
import type { QueryClient, UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPut } from '@/lib/api';

type CharacterRecord = Record<CharacterId, CollectionCharacter>;

export interface MutationResult {
  characterId: CharacterId;
  entry: CollectionCharacter;
}

// Snapshot of the collection cache taken before an optimistic write, restored
// verbatim if the mutation fails.
interface RollbackContext {
  previous: CharacterRecord | undefined;
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

// Cancels in-flight refetches so a resolving GET can't land on top of the
// optimistic write, then applies `update` to the cached collection.
async function applyOptimistic(
  queryClient: QueryClient,
  key: readonly unknown[],
  update: (current: CharacterRecord) => CharacterRecord,
): Promise<RollbackContext> {
  await queryClient.cancelQueries({ queryKey: key });
  const previous = queryClient.getQueryData<CharacterRecord>(key);
  queryClient.setQueryData<CharacterRecord>(key, update(previous ?? {}));
  return { previous };
}

function rollback(
  queryClient: QueryClient,
  key: readonly unknown[],
  context: RollbackContext | undefined,
): void {
  if (context === undefined) return;
  queryClient.setQueryData<CharacterRecord>(key, context.previous);
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
): UseMutationResult<MutationResult, Error, CharacterId, RollbackContext> {
  const queryClient = useQueryClient();
  const key = collectionKey(userId ?? '');

  return useMutation({
    mutationFn: async (characterId: CharacterId): Promise<MutationResult> => {
      const response = await apiPut(`/api/characters/${encodeURIComponent(characterId)}`, {
        constellationLevel: MIN_CONSTELLATION_LEVEL,
      });
      return parseSingleCharacterResponse(response);
    },
    onMutate: (characterId) => {
      const now = nowTimestamp();
      return applyOptimistic(queryClient, key, (current) => ({
        ...current,
        [characterId]: {
          characterId,
          constellationLevel: MIN_CONSTELLATION_LEVEL,
          createdAt: now,
          updatedAt: now,
        },
      }));
    },
    onError: (_error, _characterId, context) => {
      rollback(queryClient, key, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useRemoveCharacterMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, CharacterId, RollbackContext> {
  const queryClient = useQueryClient();
  const key = collectionKey(userId ?? '');

  return useMutation({
    mutationFn: async (characterId: CharacterId) => {
      await apiDelete(`/api/characters/${encodeURIComponent(characterId)}`);
    },
    onMutate: (characterId) =>
      applyOptimistic(queryClient, key, (current) => {
        const next = { ...current };
        delete next[characterId];
        return next;
      }),
    onError: (_error, _characterId, context) => {
      rollback(queryClient, key, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useSetConstellationLevelMutation(
  userId: string | undefined,
): UseMutationResult<
  MutationResult,
  Error,
  { characterId: CharacterId; level: number },
  RollbackContext
> {
  const queryClient = useQueryClient();
  const key = collectionKey(userId ?? '');

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
    onMutate: ({ characterId, level }) => {
      const now = nowTimestamp();
      return applyOptimistic(queryClient, key, (current) => {
        const entry = current[characterId];
        return {
          ...current,
          [characterId]: entry
            ? { ...entry, constellationLevel: level, updatedAt: now }
            : { characterId, constellationLevel: level, createdAt: now, updatedAt: now },
        };
      });
    },
    onError: (_error, _variables, context) => {
      rollback(queryClient, key, context);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
