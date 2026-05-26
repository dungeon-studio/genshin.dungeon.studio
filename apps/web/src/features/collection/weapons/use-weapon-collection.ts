// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { isValidRefinementLevel } from '@genshin/domain';

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
  addWeapon: (weaponId: Weapon['id']) => void;
  removeWeapon: (collectionWeaponId: CollectionWeaponId) => void;
  setRefinementLevel: (collectionWeaponId: CollectionWeaponId, level: number) => void;
  getWeaponsByWeaponId: (weaponId: Weapon['id']) => CollectionWeapon[];
  isLoading: boolean;
  error: Error | null;
}

export function useWeaponCollection(): UseWeaponCollectionResult {
  const { user, loading: authLoading } = useAuth();
  const isAuthenticated = user !== null;

  const weapons = useWeaponCollectionStore((s) => s.weapons);
  const storeSetWeapons = useWeaponCollectionStore((s) => s.setWeapons);
  const storeAddWeapon = useWeaponCollectionStore((s) => s.addWeapon);
  const storeRemoveWeapon = useWeaponCollectionStore((s) => s.removeWeapon);
  const storeSetRefinementLevel = useWeaponCollectionStore((s) => s.setRefinementLevel);
  const clearWeapons = useWeaponCollectionStore((s) => s.clearWeapons);

  const {
    data: apiWeapons,
    error: queryError,
    isLoading: queryLoading,
  } = useWeaponCollectionQuery(user?.uid);

  const { mutate: addWeaponApi } = useAddWeaponMutation(user?.uid);
  const { mutate: removeWeaponApi } = useRemoveWeaponMutation(user?.uid);
  const { mutate: setRefinementLevelApi } = useSetRefinementLevelMutation(user?.uid);

  const applyMutationResult = useCallback(
    ({ weapon }: WeaponMutationResult) => {
      storeAddWeapon(weapon);
    },
    [storeAddWeapon],
  );

  useEffect(() => {
    if (!user) {
      clearWeapons();
    }
  }, [user, clearWeapons]);

  useEffect(() => {
    if (!apiWeapons) return;
    storeSetWeapons(apiWeapons);
  }, [apiWeapons, storeSetWeapons]);

  const addWeapon = useCallback(
    (weaponId: Weapon['id']) => {
      if (!isAuthenticated) return;

      addWeaponApi(weaponId, {
        onSuccess: applyMutationResult,
        onError: () => {
          toast.error('Failed to add weapon.');
        },
      });
    },
    [isAuthenticated, addWeaponApi, applyMutationResult],
  );

  const removeWeapon = useCallback(
    (collectionWeaponId: CollectionWeaponId) => {
      if (!isAuthenticated) return;

      const current = useWeaponCollectionStore.getState().weapons[collectionWeaponId];
      if (!current) return;

      storeRemoveWeapon(collectionWeaponId);
      removeWeaponApi(collectionWeaponId, {
        onError: () => {
          const stillAbsent = !(collectionWeaponId in useWeaponCollectionStore.getState().weapons);
          if (stillAbsent) {
            storeAddWeapon(current);
            toast.error('Failed to remove weapon. Change has been reverted.');
          } else {
            toast.error('Failed to remove weapon.');
          }
        },
      });
    },
    [isAuthenticated, removeWeaponApi, storeRemoveWeapon, storeAddWeapon],
  );

  const setRefinementLevel = useCallback(
    (collectionWeaponId: CollectionWeaponId, level: number) => {
      if (!isAuthenticated) return;
      if (!isValidRefinementLevel(level)) return;

      const previous = useWeaponCollectionStore.getState().weapons[collectionWeaponId];
      if (!previous || previous.refinementLevel === level) return;

      storeSetRefinementLevel(collectionWeaponId, level);
      setRefinementLevelApi(
        { collectionWeaponId, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const currentLevel =
              useWeaponCollectionStore.getState().weapons[collectionWeaponId]?.refinementLevel;
            if (currentLevel === level) {
              storeSetRefinementLevel(collectionWeaponId, previous.refinementLevel);
              toast.error('Failed to update refinement level. Change has been reverted.');
            } else {
              toast.error('Failed to update refinement level.');
            }
          },
        },
      );
    },
    [isAuthenticated, setRefinementLevelApi, storeSetRefinementLevel, applyMutationResult],
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
    addWeapon,
    removeWeapon,
    setRefinementLevel,
    getWeaponsByWeaponId,
    isLoading: authLoading || (isAuthenticated && queryLoading),
    error,
  };
}
