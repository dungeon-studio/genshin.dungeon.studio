// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';
import { WEAPONS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import type { WeaponFilterState } from './filtering';
import { filterWeapons, initialFilterState } from './filtering';

// The sample tracks the generated roster, so a field added to `Weapon` needs
// no edit here.
const {
  'amos-bow': AMOS_BOW,
  'favonius-sword': FAVONIUS_SWORD,
  'staff-of-homa': STAFF_OF_HOMA,
  'the-catch': THE_CATCH,
} = WEAPONS;

// Two Polearms, two 5-star, two owned, and no two of those groups name the
// same pair. Where they coincide, a filter case passes on another's result.
const SAMPLE = [FAVONIUS_SWORD, AMOS_BOW, STAFF_OF_HOMA, THE_CATCH];
const OWNED_IDS = new Set([AMOS_BOW.id, THE_CATCH.id]);

function idsOf(weapons: readonly Weapon[]): string[] {
  return weapons.map((w) => w.id);
}

function idSetOf(weapons: readonly Weapon[]): Set<string> {
  return new Set(idsOf(weapons));
}

function filtered(overrides: Partial<WeaponFilterState> = {}): Weapon[] {
  return filterWeapons(SAMPLE, { ...initialFilterState(), ...overrides }, OWNED_IDS);
}

describe('filterWeapons', () => {
  it('returns all weapons with default filters', () => {
    expect(idSetOf(filtered())).toEqual(idSetOf(SAMPLE));
  });

  it('filters by search text (case-insensitive)', () => {
    const result = filtered({ search: STAFF_OF_HOMA.name.slice(0, 3).toUpperCase() });

    expect(idsOf(result)).toEqual([STAFF_OF_HOMA.id]);
  });

  it('filters by weapon type', () => {
    const result = filtered({ weaponTypes: new Set([THE_CATCH.type]) });

    expect(idSetOf(result)).toEqual(idSetOf([STAFF_OF_HOMA, THE_CATCH]));
  });

  it('filters by rarity', () => {
    const result = filtered({ rarities: new Set([AMOS_BOW.rarity]) });

    expect(idSetOf(result)).toEqual(idSetOf([AMOS_BOW, STAFF_OF_HOMA]));
  });

  it('filters by ownership: owned', () => {
    const result = filtered({ ownership: 'owned' });

    expect(idSetOf(result)).toEqual(OWNED_IDS);
  });

  it('filters by ownership: unowned', () => {
    const result = filtered({ ownership: 'unowned' });

    expect(idSetOf(result)).toEqual(idSetOf([FAVONIUS_SWORD, STAFF_OF_HOMA]));
  });

  it('sorts by name ascending', () => {
    const result = filtered({ sortField: 'name', sortDirection: 'asc' });

    // `The Catch` leads: its canonical name carries the quotation marks the game
    // prints around it, and `localeCompare` orders those before letters.
    expect(idsOf(result)).toEqual(idsOf([THE_CATCH, AMOS_BOW, FAVONIUS_SWORD, STAFF_OF_HOMA]));
  });

  it('sorts by release descending (default)', () => {
    expect(idsOf(filtered())).toEqual(idsOf([THE_CATCH, STAFF_OF_HOMA, FAVONIUS_SWORD, AMOS_BOW]));
  });
});
