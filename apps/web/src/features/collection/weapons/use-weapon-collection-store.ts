// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import { isValidRefinementLevel } from '@genshin/domain';
import type { Weapon, WeaponId } from '@genshin/game-data';
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

export function weaponIdsOf(instances: Iterable<CollectionWeapon>): ReadonlySet<WeaponId> {
  return new Set(Array.from(instances, (instance) => instance.weaponId));
}

/**
 * The weapon instances this browser knows the user owns, for the current
 * session only.
 *
 * Components reach for `useWeaponCollection` instead, which wraps this with the
 * server sync. This store is for that hook and for tests.
 *
 * Not persisted, unlike the character collection: an instance identifier is
 * minted by the server, so a copy recorded offline could never be reconciled
 * with the account's own records.
 */
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
