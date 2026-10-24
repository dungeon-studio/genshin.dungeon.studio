// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { awaitingUserData, signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import { useSenderBoundMutate } from '@/lib/use-sender-bound-mutate';

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

/**
 * Reconciles the local store with the server's collection whenever the query
 * resolves.
 *
 * The first resolution per signed-in user merges what this browser recorded
 * and pushes the entries the server is behind on. Refetches merge additively,
 * so they don't overwrite optimistic state while those pushes are in flight.
 */
function useServerSync(
  uid: string | undefined,
  apiCharacters: CharacterCollection | undefined,
  setConstellationLevelApi: ReturnType<typeof useSetConstellationLevelMutation>['mutate'],
  applyMutationResult: (result: MutationResult) => void,
): void {
  const replaceCharacters = useCollectionStore((s) => s.replaceCharacters);
  const mergedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (uid === undefined) {
      mergedForUser.current = null;
    }
  }, [uid]);

  useEffect(() => {
    if (!apiCharacters) return;

    const merged = mergeCollections(useCollectionStore.getState().characters, apiCharacters);
    replaceCharacters(merged);

    if (uid === undefined || mergedForUser.current === uid) return;

    const diffs = entriesAheadOfServer(merged, apiCharacters);

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

    mergedForUser.current = uid;
  }, [apiCharacters, uid, replaceCharacters, setConstellationLevelApi, applyMutationResult]);
}

export interface UseCollectionResult {
  characters: CharacterCollection;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: ConstellationLevel) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * The collection's write actions, each applied to the store before the server
 * confirms it.
 *
 * A rejected write rolls back only if the store still holds its value, so a
 * newer edit survives. Every failure toasts, and nothing retries.
 */
function useOptimisticActions(
  isAuthenticated: boolean,
  api: {
    addCharacterApi: ReturnType<typeof useAddCharacterMutation>['mutate'];
    removeCharacterApi: ReturnType<typeof useRemoveCharacterMutation>['mutate'];
    setConstellationLevelApi: ReturnType<typeof useSetConstellationLevelMutation>['mutate'];
  },
  applyMutationResult: (result: MutationResult) => void,
): Pick<UseCollectionResult, 'addCharacter' | 'removeCharacter' | 'setConstellationLevel'> {
  const { addCharacterApi, removeCharacterApi, setConstellationLevelApi } = api;
  const storeAddCharacter = useCollectionStore((s) => s.addCharacter);
  const storeRemoveCharacter = useCollectionStore((s) => s.removeCharacter);
  const storeSetConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);

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
            if (current?.constellationLevel === MIN_CONSTELLATION_LEVEL) {
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
    (id: CharacterId, level: ConstellationLevel) => {
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
              if (currentLevel === level) {
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

  return { addCharacter, removeCharacter, setConstellationLevel };
}

/**
 * The character collection page's whole interface: what the user owns, the
 * actions that change it, and the state of the sync behind it.
 *
 * Reads always come from the local store, so the page renders before the
 * network answers and keeps working signed out. Signing in merges what this
 * browser recorded with the account's own collection and pushes anything the
 * server hasn't seen, which is how a visitor's offline work survives their
 * first sign-in.
 */
export function useCollection(): UseCollectionResult {
  const auth = useAuth();
  const uid = signedInUid(auth);
  const isAuthenticated = uid !== undefined;

  // Zustand store — always the read layer
  const characters = useCollectionStore((s) => s.characters);
  const storeReplaceCharacter = useCollectionStore((s) => s.replaceCharacter);

  // TanStack Query — background sync when authenticated
  const {
    data: apiCharacters,
    error: queryError,
    isLoading: queryLoading,
  } = useCharacterCollectionQuery(uid);

  const addCharacterApi = useSenderBoundMutate(uid, useAddCharacterMutation(uid).mutate);
  const removeCharacterApi = useSenderBoundMutate(uid, useRemoveCharacterMutation(uid).mutate);
  const setConstellationLevelApi = useSenderBoundMutate(
    uid,
    useSetConstellationLevelMutation(uid).mutate,
  );

  // Patch zustand with confirmed server data
  const applyMutationResult = useCallback(
    ({ entry }: MutationResult) => {
      storeReplaceCharacter(entry);
    },
    [storeReplaceCharacter],
  );

  useServerSync(uid, apiCharacters, setConstellationLevelApi, applyMutationResult);

  const { addCharacter, removeCharacter, setConstellationLevel } = useOptimisticActions(
    isAuthenticated,
    { addCharacterApi, removeCharacterApi, setConstellationLevelApi },
    applyMutationResult,
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
    isLoading: awaitingUserData(auth, queryLoading),
    error,
  };
}
