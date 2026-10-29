// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ConstellationLevel } from '@genshin/domain';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import { useCallback, useEffect } from 'react';

import { signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import type { UserDataLoad } from '@/features/auth/use-user-data-load';
import { useUserDataLoad } from '@/features/auth/use-user-data-load';
import { offerUndo } from '@/lib/offer-undo';
import { rollBackFailedWrite } from '@/lib/roll-back-failed-write';
import type { SenderBoundMutate } from '@/lib/use-sender-bound-mutate';
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

function characterName(id: CharacterId): string {
  return getCharacterById(id)?.name ?? id;
}

const SIGNED_OUT_ACTIONS: CollectionActions = {
  addCharacter: () => {},
  removeCharacter: () => {},
  setConstellationLevel: () => {},
};

/**
 * Puts a removed character back at the level it had, unless it has already
 * been re-added. A level update creates a missing entry, so no add is sent.
 */
function useRestoreCharacter(
  setConstellationLevelApi: SenderBoundMutate<MutationResult, SetConstellationLevelVariables>,
  applyMutationResult: (result: MutationResult) => void,
): (removed: CollectionCharacter) => void {
  const storeAddCharacter = useCollectionStore((s) => s.addCharacter);
  const storeRemoveCharacter = useCollectionStore((s) => s.removeCharacter);
  const storeSetConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);

  return useCallback(
    ({ characterId: id, constellationLevel: level }: CollectionCharacter) => {
      if (id in useCollectionStore.getState().characters) return;

      storeAddCharacter(id);
      storeSetConstellationLevel(id, level);
      setConstellationLevelApi(
        { characterId: id, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const name = characterName(id);
            rollBackFailedWrite({
              isStillShown: () =>
                useCollectionStore.getState().characters[id]?.constellationLevel === level,
              revert: () => storeRemoveCharacter(id),
              failure: `Couldn't bring back ${name}.`,
              reverted: `${name} is out of your collection again.`,
            });
          },
        },
      );
    },
    [
      setConstellationLevelApi,
      storeAddCharacter,
      storeRemoveCharacter,
      storeSetConstellationLevel,
      applyMutationResult,
    ],
  );
}

/**
 * The collection's write actions, each applied to the store before the server
 * confirms it.
 *
 * A rejected write rolls back only if the store still holds its value, so a
 * newer edit survives. Every failure toasts, and nothing retries.
 */
function useOptimisticActions(
  api: {
    addCharacterApi: SenderBoundMutate<MutationResult, CharacterId>;
    removeCharacterApi: SenderBoundMutate<void, CharacterId>;
    setConstellationLevelApi: SenderBoundMutate<MutationResult, SetConstellationLevelVariables>;
  },
  applyMutationResult: (result: MutationResult) => void,
): CollectionActions {
  const { addCharacterApi, removeCharacterApi, setConstellationLevelApi } = api;
  const storeAddCharacter = useCollectionStore((s) => s.addCharacter);
  const storeRemoveCharacter = useCollectionStore((s) => s.removeCharacter);
  const storeSetConstellationLevel = useCollectionStore((s) => s.setConstellationLevel);
  const restoreCharacter = useRestoreCharacter(setConstellationLevelApi, applyMutationResult);

  const addCharacter = useCallback(
    (id: CharacterId) => {
      const alreadyOwned = id in useCollectionStore.getState().characters;
      if (alreadyOwned) return;

      storeAddCharacter(id);
      addCharacterApi(id, {
        onSuccess: applyMutationResult,
        onError: () => {
          const name = characterName(id);
          rollBackFailedWrite({
            isStillShown: () =>
              useCollectionStore.getState().characters[id]?.constellationLevel ===
              MIN_CONSTELLATION_LEVEL,
            revert: () => storeRemoveCharacter(id),
            failure: `Couldn't add ${name}.`,
            reverted: `${name} is out of your collection again.`,
          });
        },
      });
    },
    [addCharacterApi, storeAddCharacter, storeRemoveCharacter, applyMutationResult],
  );

  const removeCharacter = useCallback(
    (id: CharacterId) => {
      const current = useCollectionStore.getState().characters[id];
      if (!current) return;

      const name = characterName(id);
      const level = current.constellationLevel;

      storeRemoveCharacter(id);
      removeCharacterApi(id, {
        onSuccess: () => {
          offerUndo(`Removed ${name} at constellation level ${level}.`, () => {
            restoreCharacter(current);
          });
        },
        onError: () => {
          rollBackFailedWrite({
            isStillShown: () => !(id in useCollectionStore.getState().characters),
            revert: () => {
              storeAddCharacter(id);
              storeSetConstellationLevel(id, level);
            },
            failure: `Couldn't remove ${name}.`,
            reverted: `${name} is back in your collection.`,
          });
        },
      });
    },
    [
      removeCharacterApi,
      restoreCharacter,
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
      setConstellationLevelApi(
        { characterId: id, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const name = characterName(id);
            rollBackFailedWrite({
              isStillShown: () =>
                useCollectionStore.getState().characters[id]?.constellationLevel === level,
              revert: () => storeSetConstellationLevel(id, previousLevel),
              failure: `Couldn't set ${name} to constellation level ${level}.`,
              reverted: `${name} is back at constellation level ${previousLevel}.`,
            });
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

  const addCharacterApi = useSenderBoundMutate(uid, useAddCharacterMutation(uid).mutateAsync);
  const removeCharacterApi = useSenderBoundMutate(uid, useRemoveCharacterMutation(uid).mutateAsync);
  const setConstellationLevelApi = useSenderBoundMutate(
    uid,
    useSetConstellationLevelMutation(uid).mutateAsync,
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
