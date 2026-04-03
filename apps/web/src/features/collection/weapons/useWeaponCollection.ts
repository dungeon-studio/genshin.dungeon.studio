// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

import { isValidRefinementLevel } from '@genshin/domain';

import { useAuth } from '@/features/auth/useAuth';

import type { WeaponMutationResult } from './useWeaponCollectionApi';
import {
  useAddWeaponMutation,
  useRemoveWeaponMutation,
  useSetRefinementLevelMutation,
  useWeaponCollectionQuery,
} from './useWeaponCollectionApi';
import type { WeaponInstance, WeaponInstanceId } from './useWeaponCollectionStore';
import { useWeaponCollectionStore } from './useWeaponCollectionStore';

export interface UseWeaponCollectionResult {
  weapons: Record<WeaponInstanceId, WeaponInstance>;
  isAuthenticated: boolean;
  addWeapon: (weaponId: string) => void;
  removeWeapon: (weaponInstanceId: WeaponInstanceId) => void;
  setRefinementLevel: (weaponInstanceId: WeaponInstanceId, level: number) => void;
  getWeaponsByWeaponId: (weaponId: string) => WeaponInstance[];
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
    ({ instance }: WeaponMutationResult) => {
      storeAddWeapon(instance);
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
    (weaponId: string) => {
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
    (weaponInstanceId: WeaponInstanceId) => {
      if (!isAuthenticated) return;

      const current = useWeaponCollectionStore.getState().weapons[weaponInstanceId];
      if (!current) return;

      storeRemoveWeapon(weaponInstanceId);
      removeWeaponApi(weaponInstanceId, {
        onError: () => {
          const stillAbsent = !(weaponInstanceId in useWeaponCollectionStore.getState().weapons);
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
    (weaponInstanceId: WeaponInstanceId, level: number) => {
      if (!isAuthenticated) return;
      if (!isValidRefinementLevel(level)) return;

      const previous = useWeaponCollectionStore.getState().weapons[weaponInstanceId];
      if (!previous || previous.refinementLevel === level) return;

      storeSetRefinementLevel(weaponInstanceId, level);
      setRefinementLevelApi(
        { weaponInstanceId, level },
        {
          onSuccess: applyMutationResult,
          onError: () => {
            const currentLevel =
              useWeaponCollectionStore.getState().weapons[weaponInstanceId]?.refinementLevel;
            if (currentLevel === level) {
              storeSetRefinementLevel(weaponInstanceId, previous.refinementLevel);
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
    (weaponId: string) => {
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
