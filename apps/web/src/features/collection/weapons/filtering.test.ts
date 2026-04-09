// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { filterWeapons, initialFilterState } from './filtering';

const WEAPONS: Weapon[] = [
  { id: 'dull-blade', name: 'Dull Blade', type: 'Sword', rarity: 1, baseATK: 23, version: '1.0' },
  { id: 'amos-bow', name: "Amos' Bow", type: 'Bow', rarity: 5, baseATK: 46, version: '1.0' },
  {
    id: 'staff-of-homa',
    name: 'Staff of Homa',
    type: 'Polearm',
    rarity: 5,
    baseATK: 46,
    version: '1.3',
  },
  { id: 'the-catch', name: 'The Catch', type: 'Polearm', rarity: 4, baseATK: 42, version: '2.1' },
];

describe('filterWeapons', () => {
  const ownedIds = new Set(['amos-bow', 'the-catch']);

  it('returns all weapons with default filters', () => {
    const result = filterWeapons(WEAPONS, initialFilterState(), ownedIds);

    expect(result).toHaveLength(4);
  });

  it('filters by search text (case-insensitive)', () => {
    const filters = { ...initialFilterState(), search: 'homa' };

    const result = filterWeapons(WEAPONS, filters, ownedIds);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('staff-of-homa');
  });

  it('filters by weapon type', () => {
    const filters = {
      ...initialFilterState(),
      weaponTypes: new Set<Weapon['type']>(['Polearm']),
    };

    const result = filterWeapons(WEAPONS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => w.type === 'Polearm')).toBe(true);
  });

  it('filters by rarity', () => {
    const filters = { ...initialFilterState(), rarities: new Set<Weapon['rarity']>([5]) };

    const result = filterWeapons(WEAPONS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => w.rarity === 5)).toBe(true);
  });

  it('filters by ownership: owned', () => {
    const filters = { ...initialFilterState(), ownership: 'owned' as const };

    const result = filterWeapons(WEAPONS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => ownedIds.has(w.id))).toBe(true);
  });

  it('filters by ownership: unowned', () => {
    const filters = { ...initialFilterState(), ownership: 'unowned' as const };

    const result = filterWeapons(WEAPONS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => !ownedIds.has(w.id))).toBe(true);
  });

  it('sorts by name ascending', () => {
    const filters = {
      ...initialFilterState(),
      sortField: 'name' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterWeapons(WEAPONS, filters, ownedIds);

    expect(result[0].name).toBe("Amos' Bow");
    expect(result[result.length - 1].name).toBe('The Catch');
  });

  it('sorts by release descending (default)', () => {
    const result = filterWeapons(WEAPONS, initialFilterState(), ownedIds);

    // Version 2.1 should come first
    expect(result[0].id).toBe('the-catch');
  });
});
