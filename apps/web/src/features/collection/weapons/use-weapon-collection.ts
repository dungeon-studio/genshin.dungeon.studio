// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/use-auth';

import type { WeaponMutationResult } from './use-weapon-collection-api';
import {
  useAddWeaponMutation,
  useRemoveWeaponMutation,
  useSetRefinementLevelMutation,
  useWeaponCollectionQuery,
} from './use-weapon-collection-api';
import { useWeaponCollectionStore } from './use-weapon-collection-store';

export interface UseWeaponCollectionResult {
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
  isLoading: boolean;
  error: Error | null;
}

/**
 * The weapon collection's whole interface: the instances the user owns, the
 * actions that change them, and the state of the sync behind them.
 *
 * Every action is a no-op while signed out, unlike the character collection: an
 * instance identifier comes from the server, so there is nothing to record
 * locally first. Callers show `isAuthenticated` rather than offering an action
 * that will silently do nothing.
 */
export function useWeaponCollection(): UseWeaponCollectionResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;

  const weapons = useWeaponCollectionStore((s) => s.weapons);
  const setWeaponsLocally = useWeaponCollectionStore((s) => s.setWeapons);
  const addWeaponLocally = useWeaponCollectionStore((s) => s.addWeapon);
  const removeWeaponLocally = useWeaponCollectionStore((s) => s.removeWeapon);
  const setRefinementLevelLocally = useWeaponCollectionStore((s) => s.setRefinementLevel);
  const clearWeaponsLocally = useWeaponCollectionStore((s) => s.clearWeapons);

  const {
    data: apiWeapons,
    error: queryError,
    isLoading: queryLoading,
  } = useWeaponCollectionQuery(user?.uid);

  const { mutate: addWeaponRemotely } = useAddWeaponMutation(user?.uid);
  const { mutate: removeWeaponRemotely } = useRemoveWeaponMutation(user?.uid);
  const { mutate: setRefinementLevelRemotely } = useSetRefinementLevelMutation(user?.uid);

  const applyMutationResult = useCallback(
    ({ weapon }: WeaponMutationResult) => {
      addWeaponLocally(weapon);
    },
    [addWeaponLocally],
  );

  useEffect(() => {
    if (!user) {
      clearWeaponsLocally();
    }
  }, [user, clearWeaponsLocally]);

  useEffect(() => {
    if (!apiWeapons) return;
    setWeaponsLocally(apiWeapons);
  }, [apiWeapons, setWeaponsLocally]);

  const runAdd = useCallback(
    (weaponId: Weapon['id'], onSettled?: () => void) => {
      addWeaponRemotely(weaponId, {
        onSuccess: applyMutationResult,
        onError: () => {
          toast.error('Failed to add weapon.');
        },
        onSettled,
      });
    },
    [addWeaponRemotely, applyMutationResult],
  );

  // Additive: every call creates a new instance. Contrast ensureWeapon.
  const addWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      if (!isAuthenticated) return;
      runAdd(weaponId);
    },
    [isAuthenticated, runAdd],
  );

  // Weapon instances carry a server-generated id, so an add can't reach the
  // store until the POST resolves. Tracking in-flight adds per weapon id closes
  // the window where rapid clicks would each auto-create an instance.
  const pendingEnsures = useRef<Set<Weapon['id']>>(new Set());

  const ensureWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      if (!isAuthenticated) return;

      const alreadyOwned = Object.values(useWeaponCollectionStore.getState().weapons).some(
        (w) => w.weaponId === weaponId,
      );
      if (alreadyOwned || pendingEnsures.current.has(weaponId)) return;

      pendingEnsures.current.add(weaponId);
      runAdd(weaponId, () => {
        pendingEnsures.current.delete(weaponId);
      });
    },
    [isAuthenticated, runAdd],
  );

  const removeWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (!isAuthenticated) return;

      const current = useWeaponCollectionStore.getState().weapons[collectionWeaponId];
      if (!current) return;

      removeWeaponLocally(collectionWeaponId);
      removeWeaponRemotely(collectionWeaponId, {
        onError: () => {
          const stillAbsent = !(collectionWeaponId in useWeaponCollectionStore.getState().weapons);
          if (stillAbsent) {
            addWeaponLocally(current);
            toast.error('Failed to remove weapon. Change has been reverted.');
          } else {
            toast.error('Failed to remove weapon.');
          }
        },
      });
    },
    [isAuthenticated, removeWeaponRemotely, removeWeaponLocally, addWeaponLocally],
  );

  const setRefinementLevel = useCallback(
    (collectionWeaponId: CollectionWeaponId, level: RefinementLevel) => {
      if (!isAuthenticated) return;

      const previous = useWeaponCollectionStore.getState().weapons[collectionWeaponId];
      if (!previous || previous.refinementLevel === level) return;

      setRefinementLevelLocally(collectionWeaponId, level);
      setRefinementLevelRemotely(
        { collectionWeaponId, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const currentLevel =
              useWeaponCollectionStore.getState().weapons[collectionWeaponId]?.refinementLevel;
            if (currentLevel === level) {
              setRefinementLevelLocally(collectionWeaponId, previous.refinementLevel);
              toast.error('Failed to update refinement level. Change has been reverted.');
            } else {
              toast.error('Failed to update refinement level.');
            }
          },
        },
      );
    },
    [isAuthenticated, setRefinementLevelRemotely, setRefinementLevelLocally, applyMutationResult],
  );

  const getWeaponsByWeaponId = useCallback(
    (weaponId: Weapon['id']) => {
      return Object.values(weapons).filter((w) => w.weaponId === weaponId);
    },
    [weapons],
  );

  const error = isAuthenticated ? (queryError ?? null) : null;

  return {
    weapons,
    isAuthenticated,
    ensureWeapon,
    addWeapon,
    removeWeapon,
    setRefinementLevel,
    getWeaponsByWeaponId,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
