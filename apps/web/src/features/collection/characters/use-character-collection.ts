// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/use-auth';

import type {
  MutationResult,
  SetConstellationLevelVariables,
} from './use-character-collection-api';
import {
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';
import type { CharacterCollection } from './use-character-collection-store';
import {
  mergeCollections,
  ownedCharacters,
  useCollectionStore,
} from './use-character-collection-store';

function entriesAheadOfServer(
  merged: CharacterCollection,
  server: CharacterCollection,
): SetConstellationLevelVariables[] {
  return ownedCharacters(merged)
    .filter((entry) => {
      const serverEntry = server[entry.characterId];
      return !serverEntry || entry.constellationLevel > serverEntry.constellationLevel;
    })
    .map((entry) => ({ characterId: entry.characterId, level: entry.constellationLevel }));
}

export interface UseCollectionResult {
  characters: CharacterCollection;
  ensureCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: ConstellationLevel) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useCollection(): UseCollectionResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;

  // The store is the read layer for collection data; the query only syncs into it.
  const characters = useCollectionStore((s) => s.characters);
  const ensureCharacterLocally = useCollectionStore((s) => s.ensureCharacter);
  const removeCharacterLocally = useCollectionStore((s) => s.removeCharacter);
  const setConstellationLevelLocally = useCollectionStore((s) => s.setConstellationLevel);
  const replaceCharactersLocally = useCollectionStore((s) => s.replaceCharacters);
  const clearCharactersLocally = useCollectionStore((s) => s.clearCharacters);

  const {
    data: apiCharacters,
    error: queryError,
    isLoading: queryLoading,
  } = useCharacterCollectionQuery(user?.uid);

  const { mutate: addCharacterRemotely } = useAddCharacterMutation(user?.uid);
  const { mutate: removeCharacterRemotely } = useRemoveCharacterMutation(user?.uid);
  const { mutate: setConstellationLevelRemotely } = useSetConstellationLevelMutation(user?.uid);

  const applyMutationResult = useCallback(
    ({ characterId, entry }: MutationResult) => {
      setConstellationLevelLocally(characterId, entry.constellationLevel);
    },
    [setConstellationLevelLocally],
  );

  // Gates the anonymous-localStorage merge to the first query resolution per user.
  const mergedForUser = useRef<string | null>(null);

  // Re-login must trigger a fresh merge, and a different account must not inherit
  // the previous user's local data.
  useEffect(() => {
    if (!user) {
      mergedForUser.current = null;
      clearCharactersLocally();
    }
  }, [user, clearCharactersLocally]);

  useEffect(() => {
    if (!apiCharacters) return;

    if (user && mergedForUser.current !== user.uid) {
      const localData = useCollectionStore.getState().characters;
      const merged = mergeCollections(localData, apiCharacters);
      replaceCharactersLocally(merged);

      const diffs = entriesAheadOfServer(merged, apiCharacters);

      for (const diff of diffs) {
        setConstellationLevelRemotely(diff, {
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
      replaceCharactersLocally(merged);
    }
  }, [
    apiCharacters,
    user,
    replaceCharactersLocally,
    setConstellationLevelRemotely,
    applyMutationResult,
  ]);

  // Each mutation rolls back its optimistic store write only if the store still
  // holds that write, so rapid interactions don't clobber each other. Nothing is
  // retried.

  const ensureCharacter = useCallback(
    (id: CharacterId) => {
      const alreadyOwned = id in useCollectionStore.getState().characters;
      if (alreadyOwned) return;

      ensureCharacterLocally(id);
      if (isAuthenticated) {
        addCharacterRemotely(id, {
          onSuccess: applyMutationResult,
          onError: () => {
            const current = useCollectionStore.getState().characters[id];
            if (current?.constellationLevel === MIN_CONSTELLATION_LEVEL) {
              removeCharacterLocally(id);
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
      addCharacterRemotely,
      ensureCharacterLocally,
      removeCharacterLocally,
      applyMutationResult,
    ],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
      const current = useCollectionStore.getState().characters[id];
      if (!current) return;

      removeCharacterLocally(id);
      if (isAuthenticated) {
        removeCharacterRemotely(id, {
          onError: () => {
            const stillAbsent = !(id in useCollectionStore.getState().characters);
            if (stillAbsent) {
              ensureCharacterLocally(id);
              setConstellationLevelLocally(id, current.constellationLevel);
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
      removeCharacterRemotely,
      removeCharacterLocally,
      ensureCharacterLocally,
      setConstellationLevelLocally,
    ],
  );

  const setConstellationLevel = useCallback(
    (id: CharacterId, level: ConstellationLevel) => {
      const previousLevel = useCollectionStore.getState().characters[id]?.constellationLevel;
      if (previousLevel === undefined || previousLevel === level) return;

      setConstellationLevelLocally(id, level);
      if (isAuthenticated) {
        setConstellationLevelRemotely(
          { characterId: id, level },
          {
            onSuccess: applyMutationResult,
            onError: () => {
              const currentLevel = useCollectionStore.getState().characters[id]?.constellationLevel;
              if (previousLevel !== undefined && currentLevel === level) {
                setConstellationLevelLocally(id, previousLevel);
                toast.error('Failed to update constellation level. Change has been reverted.');
              } else {
                toast.error('Failed to update constellation level.');
              }
            },
          },
        );
      }
    },
    [
      isAuthenticated,
      setConstellationLevelRemotely,
      setConstellationLevelLocally,
      applyMutationResult,
    ],
  );

  const isOwned = useCallback((id: CharacterId) => id in characters, [characters]);
  const getCharacter = useCallback((id: CharacterId) => characters[id], [characters]);

  const error = isAuthenticated ? (queryError ?? null) : null;

  return {
    characters,
    ensureCharacter,
    removeCharacter,
    setConstellationLevel,
    isOwned,
    getCharacter,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
