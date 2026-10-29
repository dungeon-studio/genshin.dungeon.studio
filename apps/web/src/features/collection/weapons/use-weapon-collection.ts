// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import { MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { getWeaponById } from '@genshin/game-data';
import { useCallback, useRef } from 'react';

import { signedInUid } from '@/features/auth/auth-state';
import { useAuth } from '@/features/auth/use-auth';
import type { UserDataLoad } from '@/features/auth/use-user-data-load';
import { useUserDataLoad } from '@/features/auth/use-user-data-load';
import { offerUndo } from '@/lib/offer-undo';
import { reportFailedWrite, reportRolledBackWrite } from '@/lib/roll-back-failed-write';
import type { SenderBoundMutate } from '@/lib/use-sender-bound-mutate';
import { useSenderBoundMutate } from '@/lib/use-sender-bound-mutate';

import type {
  AddWeaponVariables,
  SetRefinementLevelVariables,
  WeaponCache,
  WeaponMutationResult,
} from './use-weapon-collection-api';
import {
  useAddWeaponMutation,
  useRemoveWeaponMutation,
  useSetRefinementLevelMutation,
  useWeaponCache,
  useWeaponCollectionQuery,
} from './use-weapon-collection-api';

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

const NO_WEAPONS: Record<CollectionWeaponId, CollectionWeapon> = {};

const SIGNED_OUT_ACTIONS: WeaponActions = {
  ensureWeapon: () => {},
  addWeapon: () => {},
  removeWeapon: () => {},
  setRefinementLevel: () => {},
};

/**
 * Adds a copy at the refinement rank a removed one had. The server assigns the
 * copy a new ID, so a team that had the removed one equipped stays without it.
 */
function useRestoreWeapon(
  addWeaponApi: SenderBoundMutate<WeaponMutationResult, AddWeaponVariables>,
): (removed: CollectionWeapon) => void {
  return useCallback(
    ({ weaponId, refinementLevel }: CollectionWeapon) => {
      addWeaponApi(
        { weaponId, refinementLevel },
        {
          onError: () => {
            reportFailedWrite(
              `Couldn't bring back ${weaponName(weaponId)} at refinement rank ${refinementLevel}.`,
            );
          },
        },
      );
    },
    [addWeaponApi],
  );
}

/**
 * Edits to an owned instance. The mutations show each edit before the server
 * confirms it and put back what a rejected one replaced; these name the result
 * to the user.
 */
function useInstanceEdits(
  api: {
    addWeaponApi: SenderBoundMutate<WeaponMutationResult, AddWeaponVariables>;
    removeWeaponApi: SenderBoundMutate<void, CollectionWeaponId>;
    setRefinementLevelApi: SenderBoundMutate<WeaponMutationResult, SetRefinementLevelVariables>;
  },
  cache: WeaponCache,
): Pick<UseWeaponCollectionResult, 'removeWeapon' | 'setRefinementLevel'> {
  const { addWeaponApi, removeWeaponApi, setRefinementLevelApi } = api;
  const restoreWeapon = useRestoreWeapon(addWeaponApi);

  const removeWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      const current = cache.read()[collectionWeaponId];
      if (!current) return;

      const name = weaponName(current.weaponId);

      removeWeaponApi(collectionWeaponId, {
        onSuccess: () => {
          offerUndo(`Removed ${name} at refinement rank ${current.refinementLevel}.`, () => {
            restoreWeapon(current);
          });
        },
        onError: () => {
          reportRolledBackWrite({
            restored: cache.holds(collectionWeaponId, current),
            failure: `Couldn't remove ${name}.`,
            reverted: `${name} is back in your collection.`,
          });
        },
      });
    },
    [cache, removeWeaponApi, restoreWeapon],
  );

  const setRefinementLevel = useCallback(
    (collectionWeaponId: CollectionWeaponId, level: RefinementLevel) => {
      const previous = cache.read()[collectionWeaponId];
      if (!previous || previous.refinementLevel === level) return;

      const name = weaponName(previous.weaponId);

      setRefinementLevelApi(
        { collectionWeaponId, level },
        {
          onError: () => {
            reportRolledBackWrite({
              restored: cache.holds(collectionWeaponId, previous),
              failure: `Couldn't set ${name} to refinement rank ${level}.`,
              reverted: `${name} is back at refinement rank ${previous.refinementLevel}.`,
            });
          },
        },
      );
    },
    [cache, setRefinementLevelApi],
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

  const query = useWeaponCollectionQuery(uid);
  const weapons = query.data ?? NO_WEAPONS;
  const load = useUserDataLoad(auth, query);
  const cache = useWeaponCache(uid);

  const addWeaponApi = useSenderBoundMutate(uid, useAddWeaponMutation(uid).mutateAsync);
  const removeWeaponApi = useSenderBoundMutate(uid, useRemoveWeaponMutation(uid).mutateAsync);
  const setRefinementLevelApi = useSenderBoundMutate(
    uid,
    useSetRefinementLevelMutation(uid).mutateAsync,
  );

  const runAdd = useCallback(
    (weaponId: Weapon['id'], onSettled?: () => void) => {
      addWeaponApi(
        { weaponId, refinementLevel: MIN_REFINEMENT_LEVEL },
        {
          onError: () => {
            reportFailedWrite(`Couldn't add ${weaponName(weaponId)}.`);
          },
          onSettled,
        },
      );
    },
    [addWeaponApi],
  );

  // Additive: every call creates a new instance. Contrast ensureWeapon.
  const addWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      runAdd(weaponId);
    },
    [runAdd],
  );

  // Weapon instances carry a server-generated id, so an add can't reach the
  // cache until the POST resolves. Tracking in-flight adds per weapon id closes
  // the window where rapid clicks would each auto-create an instance.
  const pendingEnsures = useRef<Set<Weapon['id']>>(new Set());

  const ensureWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      const alreadyOwned = Object.values(cache.read()).some((w) => w.weaponId === weaponId);
      if (alreadyOwned || pendingEnsures.current.has(weaponId)) return;

      pendingEnsures.current.add(weaponId);
      runAdd(weaponId, () => {
        pendingEnsures.current.delete(weaponId);
      });
    },
    [cache, runAdd],
  );

  const { removeWeapon, setRefinementLevel } = useInstanceEdits(
    { addWeaponApi, removeWeaponApi, setRefinementLevelApi },
    cache,
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
