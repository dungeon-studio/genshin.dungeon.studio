// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, ISOTimestamp } from '@genshin/domain';
import type { Weapon } from '@genshin/game-data';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWeaponCollectionStore } from './use-weapon-collection-store';

function makeWeapon(
  weaponInstanceId: string,
  weaponId: string,
  refinementLevel = 1,
): CollectionWeapon {
  return {
    weaponInstanceId: weaponInstanceId as CollectionWeaponId,
    weaponId: weaponId as Weapon['id'],
    refinementLevel,
    createdAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
    updatedAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
  };
}

describe('useWeaponCollectionStore', () => {
  beforeEach(() => {
    useWeaponCollectionStore.getState().clearWeapons();
  });

  describe('addWeapon', () => {
    it('adds a weapon to the collection', () => {
      const weapon = makeWeapon('inst-1', 'sword-1');
      useWeaponCollectionStore.getState().addWeapon(weapon);

      expect(useWeaponCollectionStore.getState().weapons['inst-1' as CollectionWeaponId]).toEqual(
        weapon,
      );
    });
  });

  describe('removeWeapon', () => {
    it('removes a weapon by instance id', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', 'sword-1'));
      useWeaponCollectionStore.getState().removeWeapon('inst-1' as CollectionWeaponId);

      expect(
        useWeaponCollectionStore.getState().weapons['inst-1' as CollectionWeaponId],
      ).toBeUndefined();
    });
  });

  describe('setRefinementLevel', () => {
    it('updates the refinement level', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', 'sword-1'));
      useWeaponCollectionStore.getState().setRefinementLevel('inst-1' as CollectionWeaponId, 3);

      expect(
        useWeaponCollectionStore.getState().weapons['inst-1' as CollectionWeaponId].refinementLevel,
      ).toBe(3);
    });

    it('ignores invalid refinement levels', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', 'sword-1'));
      useWeaponCollectionStore.getState().setRefinementLevel('inst-1' as CollectionWeaponId, 0);
      useWeaponCollectionStore.getState().setRefinementLevel('inst-1' as CollectionWeaponId, 6);

      expect(
        useWeaponCollectionStore.getState().weapons['inst-1' as CollectionWeaponId].refinementLevel,
      ).toBe(1);
    });

    it('ignores updates for nonexistent weapons', () => {
      useWeaponCollectionStore
        .getState()
        .setRefinementLevel('nonexistent' as CollectionWeaponId, 3);

      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toHaveLength(0);
    });
  });

  describe('getWeaponsByWeaponId', () => {
    it('returns all instances of a specific weapon', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', 'sword-1'));
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-2', 'sword-1'));
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-3', 'bow-1'));

      const swords = useWeaponCollectionStore
        .getState()
        .getWeaponsByWeaponId('sword-1' as Weapon['id']);

      expect(swords).toHaveLength(2);
    });

    it('returns empty array when no instances exist', () => {
      const result = useWeaponCollectionStore
        .getState()
        .getWeaponsByWeaponId('missing' as Weapon['id']);

      expect(result).toEqual([]);
    });
  });

  describe('setWeapons', () => {
    it('replaces the entire collection', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', 'sword-1'));

      const newWeapons = {
        ['inst-2' as CollectionWeaponId]: makeWeapon('inst-2', 'bow-1'),
      };
      useWeaponCollectionStore.getState().setWeapons(newWeapons);

      expect(
        useWeaponCollectionStore.getState().weapons['inst-1' as CollectionWeaponId],
      ).toBeUndefined();
      expect(
        useWeaponCollectionStore.getState().weapons['inst-2' as CollectionWeaponId],
      ).toBeDefined();
    });
  });

  describe('clearWeapons', () => {
    it('empties the collection', () => {
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-1', 'sword-1'));
      useWeaponCollectionStore.getState().addWeapon(makeWeapon('inst-2', 'bow-1'));
      useWeaponCollectionStore.getState().clearWeapons();

      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toHaveLength(0);
    });
  });
});
