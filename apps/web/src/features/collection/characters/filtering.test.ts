// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import type { CharacterFilterState } from './filtering';
import { filterCharacters, initialFilterState } from './filtering';

// The sample tracks the generated roster, so a field added to `Character`
// needs no edit here.
const {
  amber: AMBER,
  ganyu: GANYU,
  neuvillette: NEUVILLETTE,
  wriothesley: WRIOTHESLEY,
  xiangling: XIANGLING,
  zhongli: ZHONGLI,
} = CHARACTERS;

// Two Pyro, two 5-star, two owned, and no two of those groups name the same
// pair. Where they coincide, a filter case passes on another's result and the
// combined case cannot separate `and` from `or`.
const SAMPLE = [AMBER, GANYU, XIANGLING, ZHONGLI];
const OWNED_IDS = new Set([AMBER.id, GANYU.id]);

function idsOf(characters: readonly Character[]): string[] {
  return characters.map((c) => c.id);
}

function idSetOf(characters: readonly Character[]): Set<string> {
  return new Set(idsOf(characters));
}

function filtered(overrides: Partial<CharacterFilterState> = {}): Character[] {
  return filterCharacters(SAMPLE, { ...initialFilterState(), ...overrides }, OWNED_IDS);
}

describe('filterCharacters', () => {
  it('returns all characters with default filters', () => {
    expect(idSetOf(filtered())).toEqual(idSetOf(SAMPLE));
  });

  it('filters by search text (case-insensitive)', () => {
    const result = filtered({ search: GANYU.name.slice(0, 3).toUpperCase() });

    expect(idsOf(result)).toEqual([GANYU.id]);
  });

  it('filters by element', () => {
    const result = filtered({ elements: new Set([AMBER.element]) });

    expect(idSetOf(result)).toEqual(idSetOf([AMBER, XIANGLING]));
  });

  it('filters by rarity', () => {
    const result = filtered({ rarities: new Set([GANYU.rarity]) });

    expect(idSetOf(result)).toEqual(idSetOf([GANYU, ZHONGLI]));
  });

  it('filters by ownership: owned', () => {
    const result = filtered({ ownership: 'owned' });

    expect(idSetOf(result)).toEqual(OWNED_IDS);
  });

  it('filters by ownership: unowned', () => {
    const result = filtered({ ownership: 'unowned' });

    expect(idSetOf(result)).toEqual(idSetOf([XIANGLING, ZHONGLI]));
  });

  it('combines multiple filters', () => {
    const result = filtered({ elements: new Set([AMBER.element]), ownership: 'owned' });

    expect(idSetOf(result)).toEqual(idSetOf([AMBER]));
  });

  it('sorts by name ascending', () => {
    const result = filtered({ sortField: 'name', sortDirection: 'asc' });

    expect(idsOf(result)).toEqual(idsOf([AMBER, GANYU, XIANGLING, ZHONGLI]));
  });

  it('sorts by release descending (default)', () => {
    expect(idsOf(filtered())).toEqual(idsOf([GANYU, ZHONGLI, XIANGLING, AMBER]));
  });

  it('sorts by release ascending', () => {
    const result = filtered({ sortField: 'release', sortDirection: 'asc' });

    expect(idsOf(result)).toEqual(idsOf([AMBER, XIANGLING, ZHONGLI, GANYU]));
  });

  it('orders same-version characters by their release date', () => {
    // The pair exercises the date comparison only while it shares a version.
    expect(NEUVILLETTE.version).toBe(WRIOTHESLEY.version);

    const result = filterCharacters(
      [WRIOTHESLEY, NEUVILLETTE],
      { ...initialFilterState(), sortField: 'release', sortDirection: 'asc' },
      new Set<string>(),
    );

    expect(idsOf(result)).toEqual(idsOf([NEUVILLETTE, WRIOTHESLEY]));
  });
});
