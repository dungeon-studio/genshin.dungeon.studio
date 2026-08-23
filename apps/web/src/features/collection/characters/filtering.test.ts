// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { filterCharacters, initialFilterState } from './filtering';

// Indexing the roster keys the sample to real game data, so a field added to
// `Character` reaches these tests without an edit. A missing ID is a `tsc`
// error, unlike `getCharacterById`, which answers `undefined`.
const {
  amber: AMBER,
  ganyu: GANYU,
  neuvillette: NEUVILLETTE,
  wriothesley: WRIOTHESLEY,
  xiangling: XIANGLING,
  zhongli: ZHONGLI,
} = CHARACTERS;

// Two Pyro, two 5-star, two owned: every filter under test splits it in half.
const SAMPLE = [AMBER, GANYU, XIANGLING, ZHONGLI];

function idsOf(characters: readonly Character[]): string[] {
  return characters.map((c) => c.id);
}

describe('filterCharacters', () => {
  const ownedIds = new Set([AMBER.id, XIANGLING.id]);

  it('returns all characters with default filters', () => {
    const result = filterCharacters(SAMPLE, initialFilterState(), ownedIds);

    expect(result).toHaveLength(SAMPLE.length);
  });

  it('filters by search text (case-insensitive)', () => {
    const filters = { ...initialFilterState(), search: GANYU.name.slice(0, 3).toUpperCase() };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(idsOf(result)).toEqual([GANYU.id]);
  });

  it('filters by element', () => {
    const filters = { ...initialFilterState(), elements: new Set([AMBER.element]) };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.element === AMBER.element)).toBe(true);
  });

  it('filters by rarity', () => {
    const filters = { ...initialFilterState(), rarities: new Set([GANYU.rarity]) };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.rarity === GANYU.rarity)).toBe(true);
  });

  it('filters by ownership: owned', () => {
    const filters = { ...initialFilterState(), ownership: 'owned' as const };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => ownedIds.has(c.id))).toBe(true);
  });

  it('filters by ownership: unowned', () => {
    const filters = { ...initialFilterState(), ownership: 'unowned' as const };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => !ownedIds.has(c.id))).toBe(true);
  });

  it('combines multiple filters', () => {
    const filters = {
      ...initialFilterState(),
      elements: new Set([AMBER.element]),
      ownership: 'owned' as const,
    };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(result).toHaveLength(2);
  });

  it('sorts by name ascending', () => {
    const filters = {
      ...initialFilterState(),
      sortField: 'name' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(result.map((c) => c.name)).toEqual(
      [AMBER, GANYU, XIANGLING, ZHONGLI].map((c) => c.name),
    );
  });

  it('sorts by release descending (default)', () => {
    const result = filterCharacters(SAMPLE, initialFilterState(), ownedIds);

    expect(idsOf(result)).toEqual(idsOf([GANYU, ZHONGLI, XIANGLING, AMBER]));
  });

  it('sorts by release ascending', () => {
    const filters = {
      ...initialFilterState(),
      sortField: 'release' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterCharacters(SAMPLE, filters, ownedIds);

    expect(idsOf(result)).toEqual(idsOf([AMBER, XIANGLING, ZHONGLI, GANYU]));
  });

  it('orders same-version characters by their release date', () => {
    // The pair only exercises the date comparison while it shares a version.
    expect(NEUVILLETTE.version).toBe(WRIOTHESLEY.version);
    const filters = {
      ...initialFilterState(),
      sortField: 'release' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterCharacters([WRIOTHESLEY, NEUVILLETTE], filters, new Set<string>());

    expect(idsOf(result)).toEqual(idsOf([NEUVILLETTE, WRIOTHESLEY]));
  });
});
