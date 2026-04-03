// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, UUID } from '@genshin/domain';
import { isValidRefinementLevel } from '@genshin/domain';
import { create } from 'zustand';

export interface WeaponInstance {
  weaponInstanceId: UUID;
  weaponId: string;
  refinementLevel: number;
}

export type WeaponInstanceId = CollectionWeapon['weaponInstanceId'];

interface WeaponCollectionState {
  weapons: Record<WeaponInstanceId, WeaponInstance>;
  setWeapons: (weapons: Record<WeaponInstanceId, WeaponInstance>) => void;
  addWeapon: (instance: WeaponInstance) => void;
  removeWeapon: (weaponInstanceId: WeaponInstanceId) => void;
  setRefinementLevel: (weaponInstanceId: WeaponInstanceId, level: number) => void;
  getWeaponsByWeaponId: (weaponId: string) => WeaponInstance[];
  clearWeapons: () => void;
}

export const useWeaponCollectionStore = create<WeaponCollectionState>()((set, get) => ({
  weapons: {},

  setWeapons: (weapons) => {
    set({ weapons });
  },

  addWeapon: (instance) => {
    set((state) => ({
      weapons: {
        ...state.weapons,
        [instance.weaponInstanceId]: instance,
      },
    }));
  },

  removeWeapon: (weaponInstanceId) => {
    set((state) => {
      const weapons = { ...state.weapons };
      delete weapons[weaponInstanceId];
      return { weapons };
    });
  },

  setRefinementLevel: (weaponInstanceId, level) => {
    if (!isValidRefinementLevel(level)) return;

    const entry = get().weapons[weaponInstanceId];
    if (!entry) return;

    set((state) => ({
      weapons: {
        ...state.weapons,
        [weaponInstanceId]: { ...entry, refinementLevel: level },
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
