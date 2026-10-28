// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { getWeaponById } from '@genshin/game-data';
import { useCallback, useEffect, useRef } from 'react';

import { signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import type { UserDataLoad } from '@/features/auth/use-user-data-load';
import { useUserDataLoad } from '@/features/auth/use-user-data-load';
import { reportFailedWrite, rollBackFailedWrite } from '@/lib/roll-back-failed-write';
import { useSenderBoundMutate } from '@/lib/use-sender-bound-mutate';

import type { WeaponMutationResult } from './use-weapon-collection-api';
import {
  useAddWeaponMutation,
  useRemoveWeaponMutation,
  useSetRefinementLevelMutation,
  useWeaponCollectionQuery,
} from './use-weapon-collection-api';
import { useWeaponCollectionStore } from './use-weapon-collection-store';

export interface UseWeaponCollectionResult extends UserDataLoad {
  weapons: Record<CollectionWeaponId, CollectionWeapon>;
  isAuthenticated: boolean;
  /**
   * Adds a first copy only if the user has none, ignoring repeat calls while
   * one is in flight. For a caller that needs the weapon to exist, such as
   * equipping it on a team, rather than one recording another copy.
   */
  ensureWeapon: (weaponId: Weapon['id']) => void;
  /** Adds a copy unconditionally, since a user may own several. */
  addWeapon: (weaponId: Weapon['id']) => void;
  removeWeapon: (collectionWeaponId: CollectionWeaponId) => void;
  setRefinementLevel: (collectionWeaponId: CollectionWeaponId, level: RefinementLevel) => void;
  getWeaponsByWeaponId: (weaponId: Weapon['id']) => CollectionWeapon[];
}

type WeaponActions = Pick<
  UseWeaponCollectionResult,
  'ensureWeapon' | 'addWeapon' | 'removeWeapon' | 'setRefinementLevel'
>;

function weaponName(weaponId: Weapon['id']): string {
  return getWeaponById(weaponId)?.name ?? weaponId;
}

const SIGNED_OUT_ACTIONS: WeaponActions = {
  ensureWeapon: () => {},
  addWeapon: () => {},
  removeWeapon: () => {},
  setRefinementLevel: () => {},
};

/**
 * Edits to an owned instance, each applied to the store before the server
 * confirms it.
 *
 * A rejected edit rolls back only if the store still holds its value, and
 * every failure toasts. Adds can't be optimistic, because the server assigns
 * the instance ID.
 */
function useOptimisticEdits(
  api: {
    removeWeaponApi: ReturnType<typeof useRemoveWeaponMutation>['mutate'];
    setRefinementLevelApi: ReturnType<typeof useSetRefinementLevelMutation>['mutate'];
  },
  applyMutationResult: (result: WeaponMutationResult) => void,
): Pick<UseWeaponCollectionResult, 'removeWeapon' | 'setRefinementLevel'> {
  const { removeWeaponApi, setRefinementLevelApi } = api;
  const storeAddWeapon = useWeaponCollectionStore((s) => s.addWeapon);
  const storeRemoveWeapon = useWeaponCollectionStore((s) => s.removeWeapon);
  const storeSetRefinementLevel = useWeaponCollectionStore((s) => s.setRefinementLevel);

  const removeWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      const current = useWeaponCollectionStore.getState().weapons[collectionWeaponId];
      if (!current) return;

      storeRemoveWeapon(collectionWeaponId);
      removeWeaponApi(collectionWeaponId, {
        onError: () => {
          const name = weaponName(current.weaponId);
          rollBackFailedWrite({
            isStillShown: () =>
              !(collectionWeaponId in useWeaponCollectionStore.getState().weapons),
            revert: () => storeAddWeapon(current),
            failure: `Couldn't remove ${name}.`,
            reverted: `${name} is back in your collection.`,
          });
        },
      });
    },
    [removeWeaponApi, storeRemoveWeapon, storeAddWeapon],
  );

  const setRefinementLevel = useCallback(
    (collectionWeaponId: CollectionWeaponId, level: RefinementLevel) => {
      const previous = useWeaponCollectionStore.getState().weapons[collectionWeaponId];
      if (!previous || previous.refinementLevel === level) return;

      storeSetRefinementLevel(collectionWeaponId, level);
      setRefinementLevelApi(
        { collectionWeaponId, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const name = weaponName(previous.weaponId);
            rollBackFailedWrite({
              isStillShown: () =>
                useWeaponCollectionStore.getState().weapons[collectionWeaponId]?.refinementLevel ===
                level,
              revert: () => storeSetRefinementLevel(collectionWeaponId, previous.refinementLevel),
              failure: `Couldn't set ${name} to refinement rank ${level}.`,
              reverted: `${name} is back at refinement rank ${previous.refinementLevel}.`,
            });
          },
        },
      );
    },
    [setRefinementLevelApi, storeSetRefinementLevel, applyMutationResult],
  );

  return { removeWeapon, setRefinementLevel };
}

/**
 * The weapon collection's whole interface: the instances the user owns, the
 * actions that change them, and the state of the sync behind them.
 *
 * A collection belongs to an account, so every action is a no-op while signed
 * out. Callers show `isAuthenticated` rather than offering an action that will
 * silently do nothing.
 */
export function useWeaponCollection(): UseWeaponCollectionResult {
  const auth = useAuth();
  const uid = signedInUid(auth);
  const isAuthenticated = uid !== undefined;

  const weapons = useWeaponCollectionStore((s) => s.weapons);
  const storeSetWeapons = useWeaponCollectionStore((s) => s.setWeapons);
  const storeAddWeapon = useWeaponCollectionStore((s) => s.addWeapon);

  const query = useWeaponCollectionQuery(uid);
  const { data: apiWeapons } = query;
  const load = useUserDataLoad(auth, query);

  const addWeaponApi = useSenderBoundMutate(uid, useAddWeaponMutation(uid).mutate);
  const removeWeaponApi = useSenderBoundMutate(uid, useRemoveWeaponMutation(uid).mutate);
  const setRefinementLevelApi = useSenderBoundMutate(
    uid,
    useSetRefinementLevelMutation(uid).mutate,
  );

  const applyMutationResult = useCallback(
    ({ weapon }: WeaponMutationResult) => {
      storeAddWeapon(weapon);
    },
    [storeAddWeapon],
  );

  useEffect(() => {
    if (!apiWeapons) return;
    storeSetWeapons(apiWeapons);
  }, [apiWeapons, storeSetWeapons]);

  const runAdd = useCallback(
    (weaponId: Weapon['id'], onSettled?: () => void) => {
      addWeaponApi(weaponId, {
        onSuccess: applyMutationResult,
        onError: () => {
          reportFailedWrite(`Couldn't add ${weaponName(weaponId)}.`);
        },
        onSettled,
      });
    },
    [addWeaponApi, applyMutationResult],
  );

  // Additive: every call creates a new instance. Contrast ensureWeapon.
  const addWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      runAdd(weaponId);
    },
    [runAdd],
  );

  // Weapon instances carry a server-generated id, so an add can't reach the
  // store until the POST resolves. Tracking in-flight adds per weapon id closes
  // the window where rapid clicks would each auto-create an instance.
  const pendingEnsures = useRef<Set<Weapon['id']>>(new Set());

  const ensureWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      const alreadyOwned = Object.values(useWeaponCollectionStore.getState().weapons).some(
        (w) => w.weaponId === weaponId,
      );
      if (alreadyOwned || pendingEnsures.current.has(weaponId)) return;

      pendingEnsures.current.add(weaponId);
      runAdd(weaponId, () => {
        pendingEnsures.current.delete(weaponId);
      });
    },
    [runAdd],
  );

  const { removeWeapon, setRefinementLevel } = useOptimisticEdits(
    { removeWeaponApi, setRefinementLevelApi },
    applyMutationResult,
  );
  const actions = isAuthenticated
    ? { ensureWeapon, addWeapon, removeWeapon, setRefinementLevel }
    : SIGNED_OUT_ACTIONS;

  const getWeaponsByWeaponId = useCallback(
    (weaponId: Weapon['id']) => {
      return Object.values(weapons).filter((w) => w.weaponId === weaponId);
    },
    [weapons],
  );

  return {
    weapons,
    isAuthenticated,
    ...actions,
    getWeaponsByWeaponId,
    ...load,
  };
}
