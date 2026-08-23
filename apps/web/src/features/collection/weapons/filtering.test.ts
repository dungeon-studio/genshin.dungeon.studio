// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';
import { WEAPONS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { filterWeapons, initialFilterState } from './filtering';

// Indexing the roster keys the sample to real game data, so a field added to
// `Weapon` reaches these tests without an edit. A missing ID is a `tsc` error,
// unlike `getWeaponById`, which answers `undefined`.
const {
  'amos-bow': AMOS_BOW,
  'favonius-sword': FAVONIUS_SWORD,
  'staff-of-homa': STAFF_OF_HOMA,
  'the-catch': THE_CATCH,
} = WEAPONS;

// Two Polearms, two 5-star, two owned: every filter under test splits it in half.
const SAMPLE = [FAVONIUS_SWORD, AMOS_BOW, STAFF_OF_HOMA, THE_CATCH];

function idsOf(weapons: readonly Weapon[]): string[] {
  return weapons.map((w) => w.id);
}

describe('filterWeapons', () => {
  const ownedIds = new Set([AMOS_BOW.id, THE_CATCH.id]);

  it('returns all weapons with default filters', () => {
    const result = filterWeapons(SAMPLE, initialFilterState(), ownedIds);

    expect(result).toHaveLength(SAMPLE.length);
  });

  it('filters by search text (case-insensitive)', () => {
    const filters = {
      ...initialFilterState(),
      search: STAFF_OF_HOMA.name.slice(0, 3).toUpperCase(),
    };

    const result = filterWeapons(SAMPLE, filters, ownedIds);

    expect(idsOf(result)).toEqual([STAFF_OF_HOMA.id]);
  });

  it('filters by weapon type', () => {
    const filters = { ...initialFilterState(), weaponTypes: new Set([THE_CATCH.type]) };

    const result = filterWeapons(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => w.type === THE_CATCH.type)).toBe(true);
  });

  it('filters by rarity', () => {
    const filters = { ...initialFilterState(), rarities: new Set([AMOS_BOW.rarity]) };

    const result = filterWeapons(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => w.rarity === AMOS_BOW.rarity)).toBe(true);
  });

  it('filters by ownership: owned', () => {
    const filters = { ...initialFilterState(), ownership: 'owned' as const };

    const result = filterWeapons(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => ownedIds.has(w.id))).toBe(true);
  });

  it('filters by ownership: unowned', () => {
    const filters = { ...initialFilterState(), ownership: 'unowned' as const };

    const result = filterWeapons(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((w) => !ownedIds.has(w.id))).toBe(true);
  });

  it('sorts by name ascending', () => {
    const filters = {
      ...initialFilterState(),
      sortField: 'name' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterWeapons(SAMPLE, filters, ownedIds);

    // `The Catch` leads because its canonical name carries the quotation marks
    // the game prints around it, and `localeCompare` orders those before letters.
    expect(result.map((w) => w.name)).toEqual(
      [THE_CATCH, AMOS_BOW, FAVONIUS_SWORD, STAFF_OF_HOMA].map((w) => w.name),
    );
  });

  it('sorts by release descending (default)', () => {
    const result = filterWeapons(SAMPLE, initialFilterState(), ownedIds);

    expect(idsOf(result)).toEqual(idsOf([THE_CATCH, STAFF_OF_HOMA, FAVONIUS_SWORD, AMOS_BOW]));
  });
});
