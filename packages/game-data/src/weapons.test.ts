// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { compareVersions } from './versions.js';
import { WEAPONS } from './weapons.js';

// Guards the generated roster's invariants so a bad regeneration fails loudly.
describe('WEAPONS roster', () => {
  it('has the full roster', () => {
    expect(WEAPONS.length).toBeGreaterThan(200);
  });

  it('has unique ids', () => {
    const ids = WEAPONS.map((weapon) => weapon.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses kebab-case ids', () => {
    for (const weapon of WEAPONS) {
      expect(weapon.id).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    }
  });

  it('contains only obtainable rarities (3–5 star)', () => {
    for (const weapon of WEAPONS) {
      expect(weapon.rarity).toBeGreaterThanOrEqual(3);
      expect(weapon.rarity).toBeLessThanOrEqual(5);
    }
  });

  it('is sorted by rarity descending, then version descending', () => {
    for (let i = 1; i < WEAPONS.length; i++) {
      const previous = WEAPONS[i - 1];
      const current = WEAPONS[i];
      if (previous.rarity !== current.rarity) {
        expect(previous.rarity).toBeGreaterThan(current.rarity);
        continue;
      }
      expect(compareVersions(previous.version, current.version)).toBeGreaterThanOrEqual(0);
    }
  });
});
