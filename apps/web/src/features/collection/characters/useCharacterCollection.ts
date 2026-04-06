// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import type { CollectionCharacter } from '@genshin/domain';
import { isValidConstellationLevel, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';

import { useAuth } from '@/features/auth/useAuth';

import type { MutationResult } from './useCharacterCollectionApi';
import {
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './useCharacterCollectionApi';
import type { CharacterId } from './useCharacterCollectionStore';
import { mergeCollections, useCollectionStore } from './useCharacterCollectionStore';

export interface UseCollectionResult {
  characters: Record<CharacterId, CollectionCharacter>;
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

  // Merge anonymous localStorage data with server data on first query resolution
  // per user session. Subsequent resolutions (refetches) merge additively to
  // avoid overwriting optimistic state while merge mutations are in flight.
  const mergedForUser = useRef<string | null>(null);

  // Reset merge tracking and clear persisted collection on logout so
  // re-login triggers a fresh merge and a different account cannot
  // inherit the previous user's local data.
  useEffect(() => {
    if (!user) {
      mergedForUser.current = null;
      clearCharacters();
    }
  }, [user, clearCharacters]);

  useEffect(() => {
    if (!apiCharacters) return;

    if (user && mergedForUser.current !== user.uid) {
      const localData = useCollectionStore.getState().characters;
      const merged = mergeCollections(localData, apiCharacters);
      replaceCharacters(merged);

      // Push entries that differ from the server
      const diffs: Array<{ characterId: CharacterId; level: number }> = [];
      for (const id of Object.keys(merged)) {
        const entry = merged[id];
        const serverEntry = apiCharacters[id];
        if (
          isValidConstellationLevel(entry.constellationLevel) &&
          (!serverEntry || entry.constellationLevel > serverEntry.constellationLevel)
        ) {
          diffs.push({ characterId: id, level: entry.constellationLevel });
        }
      }

      for (const diff of diffs) {
        setConstellationLevelApi(diff, {
          onSuccess: applyMutationResult,
          onError: () => {
            toast.error('Failed to sync a merged character to the server.');
          },
        });
      }

      if (diffs.length > 0) {
        toast.success(`Merged ${diffs.length} character(s) from your local collection.`);
      }

      mergedForUser.current = user.uid;
    } else {
      // Keep refetches additive so in-flight merge mutations aren't overwritten.
      const currentCharacters = useCollectionStore.getState().characters;
      const merged = mergeCollections(currentCharacters, apiCharacters);
      replaceCharacters(merged);
    }
  }, [apiCharacters, user, replaceCharacters, setConstellationLevelApi, applyMutationResult]);

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
            const current = useCollectionStore.getState().characters[id];
            if (current && current.constellationLevel === MIN_CONSTELLATION_LEVEL) {
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
