// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { isValidConstellationLevel } from '@genshin/domain';
import { useQueryClient } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import { useCallback } from 'react';
import { toast } from 'sonner';

import type { UseCollectionResult } from './use-character-collection';
import {
  collectionKey,
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';

// Stable identity so an unresolved query doesn't hand consumers a fresh object
// on every render.
const NO_CHARACTERS: Record<CharacterId, CollectionCharacter> = {};

// The signed-in half of the collection: the query cache answers reads, and the
// mutations own the optimistic write and its rollback. Inert while `user` is
// null, since both the query and the mutations key off the uid.
export function useServerCollection(user: User | null): UseCollectionResult {
  const queryClient = useQueryClient();

  const { data, error, isLoading } = useCharacterCollectionQuery(user?.uid);
  const { mutate: addCharacterApi } = useAddCharacterMutation(user?.uid);
  const { mutate: removeCharacterApi } = useRemoveCharacterMutation(user?.uid);
  const { mutate: setConstellationLevelApi } = useSetConstellationLevelMutation(user?.uid);

  const characters = data ?? NO_CHARACTERS;

  // Guards read the cache rather than the render snapshot, so a burst of clicks
  // in one tick sees the optimistic writes its predecessors already made.
  const currentCharacters = useCallback(
    () =>
      queryClient.getQueryData<Record<CharacterId, CollectionCharacter>>(
        collectionKey(user?.uid ?? ''),
      ) ?? NO_CHARACTERS,
    [queryClient, user?.uid],
  );

  const addCharacter = useCallback(
    (id: CharacterId) => {
      if (id in currentCharacters()) return;

      addCharacterApi(id, {
        onError: () => {
          toast.error('Failed to add character. Change has been reverted.');
        },
      });
    },
    [currentCharacters, addCharacterApi],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
      if (!(id in currentCharacters())) return;

      removeCharacterApi(id, {
        onError: () => {
          toast.error('Failed to remove character. Change has been reverted.');
        },
      });
    },
    [currentCharacters, removeCharacterApi],
  );

  const setConstellationLevel = useCallback(
    (id: CharacterId, level: number) => {
      if (!isValidConstellationLevel(level)) return;

      const current = currentCharacters()[id];
      if (!current || current.constellationLevel === level) return;

      setConstellationLevelApi(
        { characterId: id, level },
        {
          onError: () => {
            toast.error('Failed to update constellation level. Change has been reverted.');
          },
        },
      );
    },
    [currentCharacters, setConstellationLevelApi],
  );

  const isOwned = useCallback((id: CharacterId) => id in characters, [characters]);
  const getCharacter = useCallback((id: CharacterId) => characters[id], [characters]);

  return {
    characters,
    addCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    getCharacter,
    isLoading,
    error: error ?? null,
  };
}
