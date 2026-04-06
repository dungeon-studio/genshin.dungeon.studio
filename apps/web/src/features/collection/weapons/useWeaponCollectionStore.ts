// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import { isValidRefinementLevel } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { create } from 'zustand';

interface WeaponCollectionState {
  weapons: Record<CollectionWeaponId, CollectionWeapon>;
  setWeapons: (weapons: Record<CollectionWeaponId, CollectionWeapon>) => void;
  addWeapon: (weapon: CollectionWeapon) => void;
  removeWeapon: (collectionWeaponId: CollectionWeaponId) => void;
  setRefinementLevel: (collectionWeaponId: CollectionWeaponId, level: number) => void;
  getWeaponsByWeaponId: (weaponId: Weapon['id']) => CollectionWeapon[];
  clearWeapons: () => void;
}

export const useWeaponCollectionStore = create<WeaponCollectionState>()((set, get) => ({
  weapons: {},

  setWeapons: (weapons) => {
    set({ weapons });
  },

  addWeapon: (weapon) => {
    set((state) => ({
      weapons: {
        ...state.weapons,
        [weapon.weaponInstanceId]: weapon,
      },
    }));
  },

  removeWeapon: (collectionWeaponId) => {
    set((state) => {
      const weapons = { ...state.weapons };
      delete weapons[collectionWeaponId];
      return { weapons };
    });
  },

  setRefinementLevel: (collectionWeaponId, level) => {
    if (!isValidRefinementLevel(level)) return;

    const entry = get().weapons[collectionWeaponId];
    if (!entry) return;

    set((state) => ({
      weapons: {
        ...state.weapons,
        [collectionWeaponId]: { ...entry, refinementLevel: level },
      },
    }));
  },

  getWeaponsByWeaponId: (weaponId) => {
    return Object.values(get().weapons).filter((w) => w.weaponId === weaponId);
  },

  clearWeapons: () => {
    set({ weapons: {} });
  },
}));
