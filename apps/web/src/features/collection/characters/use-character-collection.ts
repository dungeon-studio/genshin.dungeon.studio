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

  // The live entry, not the render-time `characters` snapshot: mutation
  // callbacks run after the request settles and must see the current value.
  const currentCharacter = useCallback(
    (id: CharacterId) => useCollectionStore.getState().characters[id],
    [],
  );

  /**
   * Reports a failed mutation, undoing its optimistic write first if that write
   * is still what the store holds.
   *
   * Rapid interactions can supersede an in-flight mutation, and reverting to a
   * value the user has already moved on from is worse than leaving the next
   * refetch to settle it. No retry is attempted either way.
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

  // Each mutation writes to zustand first for instant feedback, then fires the
  // API call and reconciles on the response.

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
