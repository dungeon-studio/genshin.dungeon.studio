// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { filterCharacters, initialFilterState } from './filtering';

const CHARACTERS: Character[] = [
  {
    id: 'amber',
    name: 'Amber',
    element: 'Pyro',
    weaponType: 'Bow',
    rarity: 4,
    region: 'Mondstadt',
    version: '1.0',
    releaseDate: '2020-09-28',
  },
  {
    id: 'ganyu',
    name: 'Ganyu',
    element: 'Cryo',
    weaponType: 'Bow',
    rarity: 5,
    region: 'Liyue',
    version: '1.2',
    releaseDate: '2021-01-12',
  },
  {
    id: 'xiangling',
    name: 'Xiangling',
    element: 'Pyro',
    weaponType: 'Polearm',
    rarity: 4,
    region: 'Liyue',
    version: '1.0',
    releaseDate: '2020-09-28',
  },
  {
    id: 'zhongli',
    name: 'Zhongli',
    element: 'Geo',
    weaponType: 'Polearm',
    rarity: 5,
    region: 'Liyue',
    version: '1.1',
    releaseDate: '2020-12-01',
  },
];

describe('filterCharacters', () => {
  const ownedIds = new Set(['amber', 'xiangling']);

  it('returns all characters with default filters', () => {
    const result = filterCharacters(CHARACTERS, initialFilterState(), ownedIds);

    expect(result).toHaveLength(4);
  });

  it('filters by search text (case-insensitive)', () => {
    const filters = { ...initialFilterState(), search: 'gan' };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('ganyu');
  });

  it('filters by element', () => {
    const filters = { ...initialFilterState(), elements: new Set<Character['element']>(['Pyro']) };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.element === 'Pyro')).toBe(true);
  });

  it('filters by rarity', () => {
    const filters = { ...initialFilterState(), rarities: new Set<Character['rarity']>([5]) };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => c.rarity === 5)).toBe(true);
  });

  it('filters by ownership: owned', () => {
    const filters = { ...initialFilterState(), ownership: 'owned' as const };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => ownedIds.has(c.id))).toBe(true);
  });

  it('filters by ownership: unowned', () => {
    const filters = { ...initialFilterState(), ownership: 'unowned' as const };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result).toHaveLength(2);
    expect(result.every((c) => !ownedIds.has(c.id))).toBe(true);
  });

  it('combines multiple filters', () => {
    const filters = {
      ...initialFilterState(),
      elements: new Set<Character['element']>(['Pyro']),
      ownership: 'owned' as const,
    };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result).toHaveLength(2);
  });

  it('sorts by name ascending', () => {
    const filters = {
      ...initialFilterState(),
      sortField: 'name' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    expect(result[0].name).toBe('Amber');
    expect(result[result.length - 1].name).toBe('Zhongli');
  });

  it('sorts by release descending (default)', () => {
    const result = filterCharacters(CHARACTERS, initialFilterState(), ownedIds);

    // Version 1.2 should come first in desc order
    expect(result[0].id).toBe('ganyu');
  });

  it('sorts by release ascending', () => {
    const filters = {
      ...initialFilterState(),
      sortField: 'release' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterCharacters(CHARACTERS, filters, ownedIds);

    // Version 1.0 characters should come first
    expect(result[0].version).toBe('1.0');
  });

  it('orders same-version characters by their release date', () => {
    const sameVersion: Character[] = [
      {
        id: 'wriothesley',
        name: 'Wriothesley',
        element: 'Cryo',
        weaponType: 'Catalyst',
        rarity: 5,
        region: 'Fontaine',
        version: '4.1',
        releaseDate: '2023-10-17',
      },
      {
        id: 'neuvillette',
        name: 'Neuvillette',
        element: 'Hydro',
        weaponType: 'Catalyst',
        rarity: 5,
        region: 'Fontaine',
        version: '4.1',
        releaseDate: '2023-09-27',
      },
    ];
    const filters = {
      ...initialFilterState(),
      sortField: 'release' as const,
      sortDirection: 'asc' as const,
    };

    const result = filterCharacters(sameVersion, filters, new Set<string>());

    expect(result.map((c) => c.id)).toEqual(['neuvillette', 'wriothesley']);
  });
});
