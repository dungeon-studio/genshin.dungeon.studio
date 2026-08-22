// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import { WEAPON_ROSTER } from '@genshin/game-data';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeWeapon } from '@/test/fixtures';

import { useWeaponCollectionStore } from './use-weapon-collection-store';

// Two distinct weapons, so a filtered read has something to leave out. Taken
// from game data, so a roster change cannot strand the suite.
const [WEAPON, OTHER_WEAPON] = WEAPON_ROSTER;

function storedWeapon(weaponInstanceId: CollectionWeaponId): CollectionWeapon | undefined {
  return useWeaponCollectionStore.getState().weapons[weaponInstanceId];
}

describe('useWeaponCollectionStore', () => {
  beforeEach(() => {
    useWeaponCollectionStore.getState().clearWeapons();
  });

  describe('addWeapon', () => {
    it('adds a weapon to the collection', () => {
      const weapon = makeWeapon('inst-1', WEAPON.id);
      useWeaponCollectionStore.getState().addWeapon(weapon);

      expect(storedWeapon('inst-1')).toEqual(weapon);
    });
  });

  describe('removeWeapon', () => {
    it('removes a weapon by instance id', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', WEAPON.id));
      useWeaponCollectionStore.getState().removeWeapon('inst-1');

      expect(storedWeapon('inst-1')).toBeUndefined();
    });
  });

  describe('setRefinementLevel', () => {
    it('updates the refinement level', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', WEAPON.id));
      useWeaponCollectionStore.getState().setRefinementLevel('inst-1', 3);

      expect(storedWeapon('inst-1')?.refinementLevel).toBe(3);
    });

    it('ignores invalid refinement levels', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', WEAPON.id));
      useWeaponCollectionStore.getState().setRefinementLevel('inst-1', 0);
      useWeaponCollectionStore.getState().setRefinementLevel('inst-1', 6);

      expect(storedWeapon('inst-1')?.refinementLevel).toBe(1);
    });

    it('ignores updates for nonexistent weapons', () => {
      useWeaponCollectionStore.getState().setRefinementLevel('nonexistent', 3);

      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toHaveLength(0);
    });
  });

  describe('getWeaponsByWeaponId', () => {
    it('returns all instances of a specific weapon', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', WEAPON.id));
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-2', WEAPON.id));
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-3', OTHER_WEAPON.id));

      const instances = useWeaponCollectionStore.getState().getWeaponsByWeaponId(WEAPON.id);

      expect(instances).toHaveLength(2);
    });

    it('returns empty array when no instances exist', () => {
      const result = useWeaponCollectionStore.getState().getWeaponsByWeaponId(OTHER_WEAPON.id);

      expect(result).toEqual([]);
    });
  });

  describe('setWeapons', () => {
    it('replaces the entire collection', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', WEAPON.id));

      const newWeapons = {
        'inst-2': makeWeapon('inst-2', OTHER_WEAPON.id),
      };
      useWeaponCollectionStore.getState().setWeapons(newWeapons);

      expect(storedWeapon('inst-1')).toBeUndefined();
      expect(storedWeapon('inst-2')).toBeDefined();
    });
  });

  describe('clearWeapons', () => {
    it('empties the collection', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', WEAPON.id));
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-2', OTHER_WEAPON.id));
      useWeaponCollectionStore.getState().clearWeapons();

      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toHaveLength(0);
    });
  });
});
