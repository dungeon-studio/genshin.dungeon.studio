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

  const applyMutationResult = useCallback(
    ({ characterId, entry }: MutationResult) => {
      storeSetConstellationLevel(characterId, entry.constellationLevel);
    },
    [storeSetConstellationLevel],
  );

  // Account isolation: the next user to sign in must not inherit this one.
  useEffect(() => {
    if (!user) clearCharacters();
  }, [user, clearCharacters]);

  useEffect(() => {
    if (!apiCharacters) return;
    replaceCharacters(apiCharacters);
  }, [apiCharacters, replaceCharacters]);

  // Reads through to the store rather than the render-time `characters`, which
  // mutation callbacks close over stale.
  const currentCharacter = useCallback(
    (id: CharacterId) => useCollectionStore.getState().characters[id],
    [],
  );

  /**
   * Rapid interactions can supersede an in-flight mutation, so a failure only
   * reverts a write the store still holds: restoring a value the user has
   * already moved past is worse than leaving the next refetch to settle it.
   * No retry either way.
   */
  const reportFailure = useCallback(
    (action: string, isStillOptimistic: () => boolean, revert: () => void) => {
      if (isStillOptimistic()) {
        revert();
        toast.error(`Failed to ${action}. Change has been reverted.`);
      } else {
        toast.error(`Failed to ${action}.`);
      }
    },
    [],
  );

  const addCharacter = useCallback(
    (id: CharacterId) => {
      if (!isAuthenticated) return;
      if (currentCharacter(id)) return;

      storeAddCharacter(id);
      addCharacterApi(id, {
        onSuccess: applyMutationResult,
        onError: () =>
          reportFailure(
            'add character',
            () => currentCharacter(id)?.constellationLevel === MIN_CONSTELLATION_LEVEL,
            () => storeRemoveCharacter(id),
          ),
      });
    },
    [
      isAuthenticated,
      addCharacterApi,
      storeAddCharacter,
      storeRemoveCharacter,
      applyMutationResult,
      currentCharacter,
      reportFailure,
    ],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
      if (!isAuthenticated) return;

      const previous = currentCharacter(id);
      if (!previous) return;

      storeRemoveCharacter(id);
      removeCharacterApi(id, {
        onError: () =>
          reportFailure(
            'remove character',
            () => currentCharacter(id) === undefined,
            () => {
              storeAddCharacter(id);
              storeSetConstellationLevel(id, previous.constellationLevel);
            },
          ),
      });
    },
    [
      isAuthenticated,
      removeCharacterApi,
      storeRemoveCharacter,
      storeAddCharacter,
      storeSetConstellationLevel,
      currentCharacter,
      reportFailure,
    ],
  );

  const setConstellationLevel = useCallback(
    (id: CharacterId, level: number) => {
      if (!isAuthenticated) return;

      const previousLevel = currentCharacter(id)?.constellationLevel;
      if (previousLevel === undefined || previousLevel === level) return;

      storeSetConstellationLevel(id, level);
      setConstellationLevelApi(
        { characterId: id, level },
        {
          onSuccess: applyMutationResult,
          onError: () =>
            reportFailure(
              'update constellation level',
              () => currentCharacter(id)?.constellationLevel === level,
              () => storeSetConstellationLevel(id, previousLevel),
            ),
        },
      );
    },
    [
      isAuthenticated,
      setConstellationLevelApi,
      storeSetConstellationLevel,
      applyMutationResult,
      currentCharacter,
      reportFailure,
    ],
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
