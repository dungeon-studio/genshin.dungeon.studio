// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { buildWeapons } from './weapons.js';

type BuiltWeapon = ReturnType<typeof buildWeapons>[number];

function precedes(previous: BuiltWeapon, current: BuiltWeapon): boolean {
  return previous.rarity === current.rarity
    ? compareVersions(previous.version, current.version) >= 0
    : previous.rarity > current.rarity;
}

describe('buildWeapons', () => {
  const weapons = buildWeapons();

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
    // Naming the repeat matters: the roster's keyed literal reports a collision
    // as a TS1117 line number, without saying which id it landed on.
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it('sorts by rarity descending, then version descending', () => {
    const outOfOrder = weapons
      .slice(1)
      .filter((current, index) => !precedes(weapons[index], current));

    expect(outOfOrder).toEqual([]);
  });
});
