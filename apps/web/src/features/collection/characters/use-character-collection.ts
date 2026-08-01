// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/use-auth';

import type { MutationResult } from './use-character-collection-api';
import {
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';
import { useCollectionStore } from './use-character-collection-store';

export interface UseCollectionResult {
  characters: Record<CharacterId, CollectionCharacter>;
  isAuthenticated: boolean;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection(): UseCollectionResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;

  // Zustand store — always the read layer
  const characters = useCollectionStore((s) => s.characters);
  const storeAddCharacter = useCollectionStore((s) => s.addCharacter);
  const storeRemoveCharacter = useCollectionStore((s) => s.removeCharacter);
  const storeSetConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);
  const replaceCharacters = useCollectionStore((s) => s.replaceCharacters);
  const clearCharacters = useCollectionStore((s) => s.clearCharacters);

  // TanStack Query — background sync when authenticated
  const {
    data: apiCharacters,
    error: queryError,
    isLoading: queryLoading,
  } = useCharacterCollectionQuery(user?.uid);

  const { mutate: addCharacterApi } = useAddCharacterMutation(user?.uid);
  const { mutate: removeCharacterApi } = useRemoveCharacterMutation(user?.uid);
  const { mutate: setConstellationLevelApi } = useSetConstellationLevelMutation(user?.uid);

  // Patch zustand with confirmed server data
  const applyMutationResult = useCallback(
    ({ characterId, entry }: MutationResult) => {
      storeSetConstellationLevel(characterId, entry.constellationLevel);
    },
    [storeSetConstellationLevel],
  );

  // Drop the in-memory collection on logout so a different account cannot read
  // the previous user's data.
  useEffect(() => {
    if (!user) clearCharacters();
  }, [user, clearCharacters]);

  // The server is the only source of characters, so a resolved query replaces
  // the store outright rather than merging into it.
  useEffect(() => {
    if (!apiCharacters) return;
    replaceCharacters(apiCharacters);
  }, [apiCharacters, replaceCharacters]);

  // Mutation error strategy: optimistic rollback + toast notification.
  // Each mutation writes to zustand first for instant UI feedback, then fires
  // the API call. On failure the onError callback rolls back the zustand change
  // only if the store still reflects this mutation's optimistic value (guards
  // against races from rapid user interactions). Errors are surfaced via toast
  // side-effects — no retry is attempted.

  const addCharacter = useCallback(
    (id: CharacterId) => {
      if (!isAuthenticated) return;

      const alreadyOwned = id in useCollectionStore.getState().characters;
      if (alreadyOwned) return;

      storeAddCharacter(id);
      addCharacterApi(id, {
        onSuccess: applyMutationResult,
        onError: () => {
          const current = useCollectionStore.getState().characters[id];
          if (current && current.constellationLevel === MIN_CONSTELLATION_LEVEL) {
            storeRemoveCharacter(id);
            toast.error('Failed to add character. Change has been reverted.');
          } else {
            toast.error('Failed to add character.');
          }
        },
      });
    },
    [
      isAuthenticated,
      addCharacterApi,
      storeAddCharacter,
      storeRemoveCharacter,
      applyMutationResult,
    ],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
      if (!isAuthenticated) return;

      const current = useCollectionStore.getState().characters[id];
      if (!current) return;

      storeRemoveCharacter(id);
      removeCharacterApi(id, {
        onError: () => {
          const stillAbsent = !(id in useCollectionStore.getState().characters);
          if (stillAbsent) {
            storeAddCharacter(id);
            storeSetConstellationLevel(id, current.constellationLevel);
            toast.error('Failed to remove character. Change has been reverted.');
          } else {
            toast.error('Failed to remove character.');
          }
        },
      });
    },
    [
      isAuthenticated,
      removeCharacterApi,
      storeRemoveCharacter,
      storeAddCharacter,
      storeSetConstellationLevel,
    ],
  );

  const setConstellationLevel = useCallback(
    (id: CharacterId, level: number) => {
      if (!isAuthenticated) return;

      const previousLevel = useCollectionStore.getState().characters[id]?.constellationLevel;
      if (previousLevel === undefined || previousLevel === level) return;

      storeSetConstellationLevel(id, level);
      setConstellationLevelApi(
        { characterId: id, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const currentLevel = useCollectionStore.getState().characters[id]?.constellationLevel;
            if (currentLevel === level) {
              storeSetConstellationLevel(id, previousLevel);
              toast.error('Failed to update constellation level. Change has been reverted.');
            } else {
              toast.error('Failed to update constellation level.');
            }
          },
        },
      );
    },
    [isAuthenticated, setConstellationLevelApi, storeSetConstellationLevel, applyMutationResult],
  );

  const isOwned = useCallback((id: CharacterId) => id in characters, [characters]);
  const getCharacter = useCallback((id: CharacterId) => characters[id], [characters]);

  const error = isAuthenticated ? (queryError ?? null) : null;

  return {
    characters,
    isAuthenticated,
    addCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    getCharacter,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
