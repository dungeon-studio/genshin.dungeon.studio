// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/useAuth';

import type { MutationResult } from './useCollectionApi';
import {
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './useCollectionApi';
import type { CharacterId, CollectionEntry } from './useCollectionStore';
import { useCollectionStore } from './useCollectionStore';

export interface UseCollectionResult {
  characters: Record<CharacterId, CollectionEntry>;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: number) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionEntry | undefined;
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

  // TanStack Query — background sync when authenticated
  const {
    data: apiCharacters,
    error: queryError,
    isLoading: queryLoading,
  } = useCharacterCollectionQuery(user?.uid);

  const { mutate: addCharacterApi } = useAddCharacterMutation(user?.uid);
  const { mutate: removeCharacterApi } = useRemoveCharacterMutation(user?.uid);
  const { mutate: setConstellationLevelApi } = useSetConstellationLevelMutation(user?.uid);

  // Sync API data into zustand when the query resolves
  useEffect(() => {
    if (apiCharacters) {
      replaceCharacters(apiCharacters);
    }
  }, [apiCharacters, replaceCharacters]);

  // Patch zustand with confirmed server data
  const applyMutationResult = useCallback(
    ({ characterId, entry }: MutationResult) => {
      storeSetConstellationLevel(characterId, entry.constellationLevel);
    },
    [storeSetConstellationLevel],
  );

  // Mutation error strategy: optimistic rollback + toast notification.
  // Each mutation writes to zustand first for instant UI feedback, then fires
  // the API call. On failure the onError callback rolls back the zustand change
  // only if the store still reflects this mutation's optimistic value (guards
  // against races from rapid user interactions). Errors are surfaced via toast
  // side-effects — no retry is attempted.

  const addCharacter = useCallback(
    (id: CharacterId) => {
      const alreadyOwned = id in useCollectionStore.getState().characters;
      if (alreadyOwned) return;

      storeAddCharacter(id);
      if (isAuthenticated) {
        addCharacterApi(id, {
          onSuccess: applyMutationResult,
          onError: () => {
            const stillExists = id in useCollectionStore.getState().characters;
            if (stillExists) {
              storeRemoveCharacter(id);
              toast.error('Failed to add character. Change has been reverted.');
            } else {
              toast.error('Failed to add character.');
            }
          },
        });
      }
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
      const current = useCollectionStore.getState().characters[id];
      if (!current) return;

      storeRemoveCharacter(id);
      if (isAuthenticated) {
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
      }
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
      const previousLevel = useCollectionStore.getState().characters[id]?.constellationLevel;
      if (previousLevel === undefined || previousLevel === level) return;

      storeSetConstellationLevel(id, level);
      if (isAuthenticated) {
        setConstellationLevelApi(
          { characterId: id, level },
          {
            onSuccess: applyMutationResult,
            onError: () => {
              const currentLevel = useCollectionStore.getState().characters[id]?.constellationLevel;
              if (previousLevel !== undefined && currentLevel === level) {
                storeSetConstellationLevel(id, previousLevel);
                toast.error('Failed to update constellation level. Change has been reverted.');
              } else {
                toast.error('Failed to update constellation level.');
              }
            },
          },
        );
      }
    },
    [isAuthenticated, setConstellationLevelApi, storeSetConstellationLevel, applyMutationResult],
  );

  const isOwned = useCallback((id: CharacterId) => id in characters, [characters]);
  const getCharacter = useCallback((id: CharacterId) => characters[id], [characters]);

  const error = isAuthenticated ? (queryError ?? null) : null;

  return {
    characters,
    addCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    getCharacter,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
