// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter } from '@genshin/domain';
import { isValidConstellationLevel } from '@genshin/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/use-auth';

import {
  collectionKey,
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';
import { mergeCollections, useCollectionStore } from './use-character-collection-store';

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

// Stable identity so an unresolved query doesn't hand consumers a fresh object
// on every render.
const NO_CHARACTERS: Record<CharacterId, CollectionCharacter> = {};

// Collection state is split along the authentication boundary: anonymous users
// read and write the persisted zustand store with no API involvement, while
// authenticated users read and write the TanStack Query cache, which handles
// optimistic updates and rollback natively. Signing in merges the local
// collection up once and then empties the store, so the two never overlap.
export function useCollection(): UseCollectionResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;
  const queryClient = useQueryClient();

  const localCharacters = useCollectionStore((s) => s.characters);
  const storeAddCharacter = useCollectionStore((s) => s.addCharacter);
  const storeRemoveCharacter = useCollectionStore((s) => s.removeCharacter);
  const storeSetConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);
  const clearCharacters = useCollectionStore((s) => s.clearCharacters);

  const {
    data: serverCharacters,
    error: queryError,
    isLoading: queryLoading,
  } = useCharacterCollectionQuery(user?.uid);

  const { mutate: addCharacterApi } = useAddCharacterMutation(user?.uid);
  const { mutate: removeCharacterApi } = useRemoveCharacterMutation(user?.uid);
  const { mutate: setConstellationLevelApi } = useSetConstellationLevelMutation(user?.uid);

  const characters = isAuthenticated ? (serverCharacters ?? NO_CHARACTERS) : localCharacters;

  // Mutation guards read the cache directly rather than the render snapshot, so
  // a burst of clicks in one tick sees the optimistic writes its predecessors
  // already made.
  const currentCharacters = useCallback(
    () =>
      queryClient.getQueryData<Record<CharacterId, CollectionCharacter>>(
        collectionKey(user?.uid ?? ''),
      ) ?? NO_CHARACTERS,
    [queryClient, user?.uid],
  );

  // The uid of the session that has already been merged, so a refetch or
  // re-render doesn't push the same local entries a second time.
  const mergedForUser = useRef<string | null>(null);
  // The uid last observed as signed in, so a sign-out is distinguished from the
  // signed-out-on-mount state that precedes auth resolving.
  const signedInUser = useRef<string | null>(null);

  // Drop any local data on sign-out so the next account to sign in on this
  // browser cannot merge the previous account's collection into its own.
  useEffect(() => {
    if (authLoading || user) return;
    if (signedInUser.current === null) return;

    signedInUser.current = null;
    mergedForUser.current = null;
    clearCharacters();
  }, [user, authLoading, clearCharacters]);

  // One-time additive merge of the anonymous collection into the server
  // collection, then the local copy is dropped. A failed push keeps the local
  // copy so the next sign-in for this account retries it.
  useEffect(() => {
    if (!user || !serverCharacters) return;

    signedInUser.current = user.uid;
    if (mergedForUser.current === user.uid) return;
    mergedForUser.current = user.uid;

    const local = useCollectionStore.getState().characters;
    const merged = mergeCollections(local, serverCharacters);

    const diffs: Array<{ characterId: CharacterId; level: number }> = [];
    for (const id of Object.keys(merged)) {
      const entry = merged[id];
      const serverEntry = serverCharacters[id];
      if (
        isValidConstellationLevel(entry.constellationLevel) &&
        (!serverEntry || entry.constellationLevel > serverEntry.constellationLevel)
      ) {
        diffs.push({ characterId: id, level: entry.constellationLevel });
      }
    }

    if (diffs.length === 0) {
      clearCharacters();
      return;
    }

    let outstanding = diffs.length;
    let failed = false;
    for (const diff of diffs) {
      setConstellationLevelApi(diff, {
        onError: () => {
          failed = true;
          toast.error('Failed to sync a merged character to the server.');
        },
        onSettled: () => {
          outstanding -= 1;
          if (outstanding === 0 && !failed) clearCharacters();
        },
      });
    }

    toast.success(`Merged ${diffs.length} character(s) from your local collection.`);
  }, [user, serverCharacters, clearCharacters, setConstellationLevelApi]);

  const addCharacter = useCallback(
    (id: CharacterId) => {
      if (isAuthenticated) {
        if (id in currentCharacters()) return;
        addCharacterApi(id, {
          onError: () => {
            toast.error('Failed to add character. Change has been reverted.');
          },
        });
        return;
      }

      storeAddCharacter(id);
    },
    [isAuthenticated, currentCharacters, addCharacterApi, storeAddCharacter],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
      if (isAuthenticated) {
        if (!(id in currentCharacters())) return;
        removeCharacterApi(id, {
          onError: () => {
            toast.error('Failed to remove character. Change has been reverted.');
          },
        });
        return;
      }

      storeRemoveCharacter(id);
    },
    [isAuthenticated, currentCharacters, removeCharacterApi, storeRemoveCharacter],
  );

  const setConstellationLevel = useCallback(
    (id: CharacterId, level: number) => {
      if (!isValidConstellationLevel(level)) return;

      if (isAuthenticated) {
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
        return;
      }

      storeSetConstellationLevel(id, level);
    },
    [isAuthenticated, currentCharacters, setConstellationLevelApi, storeSetConstellationLevel],
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
