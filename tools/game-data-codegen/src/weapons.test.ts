// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions, WEAPON_STAT_TYPES, WEAPON_TYPES } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { buildWeapons, toKebabCase } from './weapons.js';

describe('toKebabCase', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(toKebabCase('Mistsplitter Reforged')).toBe('mistsplitter-reforged');
  });

  it('strips apostrophes rather than hyphenating them', () => {
    expect(toKebabCase("Wolf's Gravestone")).toBe('wolfs-gravestone');
    expect(toKebabCase('Amos’ Bow')).toBe('amos-bow');
  });

  it('collapses runs of punctuation and trims edges', () => {
    expect(toKebabCase('  The Catch!! ')).toBe('the-catch');
    expect(toKebabCase('Wine & Song')).toBe('wine-song');
  });
});

describe('buildWeapons', () => {
  const weapons = buildWeapons();
  const types = new Set<string>(Object.values(WEAPON_TYPES));
  const subStats = new Set<string>(Object.values(WEAPON_STAT_TYPES));

  it('returns a nonempty roster', () => {
    expect(weapons.length).toBeGreaterThan(0);
  });

  it('includes only 4- and 5-star weapons', () => {
    for (const weapon of weapons) {
      expect([4, 5]).toContain(weapon.rarity);
    }
  });

  it('produces unique, nonempty ids', () => {
    const ids = weapons.map((weapon) => weapon.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it('maps every type and sub-stat into the domain vocabulary', () => {
    for (const weapon of weapons) {
      expect(types).toContain(weapon.type);
      if (weapon.subStatType) expect(subStats).toContain(weapon.subStatType);
    }
  });

  it('sorts by rarity descending, then version descending', () => {
    for (let i = 1; i < weapons.length; i++) {
      const previous = weapons[i - 1];
      const current = weapons[i];
      if (previous.rarity !== current.rarity) {
        expect(previous.rarity).toBeGreaterThan(current.rarity);
        continue;
      }
      expect(compareVersions(previous.version, current.version)).toBeGreaterThanOrEqual(0);
    }
  });
});
