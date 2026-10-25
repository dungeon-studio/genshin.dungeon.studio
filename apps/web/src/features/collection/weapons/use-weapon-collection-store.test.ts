// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import { WEAPON_ROSTER } from '@genshin/game-data';
import { assert, beforeEach, describe, expect, it } from 'vitest';

import { makeWeapon } from '@/test/fixtures';

import { groupByWeapon, useWeaponCollectionStore } from './use-weapon-collection-store';

// Two weapons from game data, so a filtered read has something to leave out
// and a roster change cannot strand the suite.
const [WEAPON, OTHER_WEAPON] = WEAPON_ROSTER;
assert.isDefined(WEAPON);
assert.isDefined(OTHER_WEAPON);

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

    it('ignores updates for nonexistent weapons', () => {
      useWeaponCollectionStore.getState().setRefinementLevel('nonexistent', 3);

      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toHaveLength(0);
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

describe('groupByWeapon', () => {
  it('collects every instance under its weapon', () => {
    const first = makeWeapon('inst-1', WEAPON.id);
    const other = makeWeapon('inst-2', OTHER_WEAPON.id);
    const second = makeWeapon('inst-3', WEAPON.id);

    const groups = groupByWeapon([first, other, second]);

    expect(groups).toEqual(
      new Map([
        [WEAPON.id, [first, second]],
        [OTHER_WEAPON.id, [other]],
      ]),
    );
  });
});
