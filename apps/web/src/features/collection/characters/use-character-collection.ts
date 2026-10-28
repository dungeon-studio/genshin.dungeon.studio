// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import type { UserDataLoad } from '@/features/auth/use-user-data-load';
import { useUserDataLoad } from '@/features/auth/use-user-data-load';
import { useSenderBoundMutate } from '@/lib/use-sender-bound-mutate';

import type { MutationResult } from './use-character-collection-api';
import {
  useAddCharacterMutation,
  useCharacterCollectionQuery,
  useRemoveCharacterMutation,
  useSetConstellationLevelMutation,
} from './use-character-collection-api';
import type { CharacterCollection } from './use-character-collection-store';
import { useCollectionStore } from './use-character-collection-store';

export interface UseCollectionResult extends UserDataLoad {
  characters: CharacterCollection;
  isAuthenticated: boolean;
  addCharacter: (characterId: CharacterId) => void;
  removeCharacter: (characterId: CharacterId) => void;
  setConstellationLevel: (characterId: CharacterId, level: ConstellationLevel) => void;
  isOwned: (characterId: CharacterId) => boolean;
  getCharacter: (characterId: CharacterId) => CollectionCharacter | undefined;
}

type CollectionActions = Pick<
  UseCollectionResult,
  'addCharacter' | 'removeCharacter' | 'setConstellationLevel'
>;

const SIGNED_OUT_ACTIONS: CollectionActions = {
  addCharacter: () => {},
  removeCharacter: () => {},
  setConstellationLevel: () => {},
};

/**
 * The collection's write actions, each applied to the store before the server
 * confirms it.
 *
 * A rejected write rolls back only if the store still holds its value, so a
 * newer edit survives. Every failure toasts, and nothing retries.
 */
function useOptimisticActions(
  api: {
    addCharacterApi: ReturnType<typeof useAddCharacterMutation>['mutate'];
    removeCharacterApi: ReturnType<typeof useRemoveCharacterMutation>['mutate'];
    setConstellationLevelApi: ReturnType<typeof useSetConstellationLevelMutation>['mutate'];
  },
  applyMutationResult: (result: MutationResult) => void,
): CollectionActions {
  const { addCharacterApi, removeCharacterApi, setConstellationLevelApi } = api;
  const storeAddCharacter = useCollectionStore((s) => s.addCharacter);
  const storeRemoveCharacter = useCollectionStore((s) => s.removeCharacter);
  const storeSetConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);

  const addCharacter = useCallback(
    (id: CharacterId) => {
      const alreadyOwned = id in useCollectionStore.getState().characters;
      if (alreadyOwned) return;

      storeAddCharacter(id);
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
    },
    [addCharacterApi, storeAddCharacter, storeRemoveCharacter, applyMutationResult],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
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
    [removeCharacterApi, storeRemoveCharacter, storeAddCharacter, storeSetConstellationLevel],
  );

  const setConstellationLevel = useCallback(
    (id: CharacterId, level: ConstellationLevel) => {
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
    [setConstellationLevelApi, storeSetConstellationLevel, applyMutationResult],
  );

  return { addCharacter, removeCharacter, setConstellationLevel };
}

/**
 * The character collection page's whole interface: what the user owns, the
 * actions that change it, and the state of the sync behind it.
 *
 * A collection belongs to an account, so every action is a no-op while signed
 * out. Callers show `isAuthenticated` rather than offering an action that will
 * silently do nothing.
 */
export function useCollection(): UseCollectionResult {
  const auth = useAuth();
  const uid = signedInUid(auth);
  const isAuthenticated = uid !== undefined;

  const characters = useCollectionStore((s) => s.characters);
  const storeReplaceCharacter = useCollectionStore((s) => s.replaceCharacter);
  const storeReplaceCharacters = useCollectionStore((s) => s.replaceCharacters);

  const query = useCharacterCollectionQuery(uid);
  const { data: apiCharacters } = query;
  const load = useUserDataLoad(auth, query);

  const addCharacterApi = useSenderBoundMutate(uid, useAddCharacterMutation(uid).mutate);
  const removeCharacterApi = useSenderBoundMutate(uid, useRemoveCharacterMutation(uid).mutate);
  const setConstellationLevelApi = useSenderBoundMutate(
    uid,
    useSetConstellationLevelMutation(uid).mutate,
  );

  const applyMutationResult = useCallback(
    ({ entry }: MutationResult) => {
      storeReplaceCharacter(entry);
    },
    [storeReplaceCharacter],
  );

  useEffect(() => {
    if (!apiCharacters) return;
    storeReplaceCharacters(apiCharacters);
  }, [apiCharacters, storeReplaceCharacters]);

  const optimisticActions = useOptimisticActions(
    { addCharacterApi, removeCharacterApi, setConstellationLevelApi },
    applyMutationResult,
  );
  const actions = isAuthenticated ? optimisticActions : SIGNED_OUT_ACTIONS;

  const isOwned = useCallback((id: CharacterId) => id in characters, [characters]);
  const getCharacter = useCallback((id: CharacterId) => characters[id], [characters]);

  return {
    characters,
    isAuthenticated,
    ...actions,
    isOwned,
    getCharacter,
    ...load,
  };
}
