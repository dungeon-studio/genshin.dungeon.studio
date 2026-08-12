// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { getWeaponById, WEAPON_ROSTER } from './weapons.js';

describe('WEAPON_ROSTER', () => {
  it('is not empty', () => {
    // The generator guarantees rarity range and sort order, the record type
    // unique ids. This only catches a generation that silently produced
    // nothing.
    expect(WEAPON_ROSTER.length).toBeGreaterThan(0);
  });
});

describe('getWeaponById', () => {
  it('rejects the ids every object inherits', () => {
    // The catalogue is a plain object, so a bare index would hand back
    // `Object.prototype.constructor` as a weapon and let it through the
    // callers that use this as an existence gate.
    for (const inherited of ['constructor', 'toString', 'valueOf', '__proto__']) {
      expect(getWeaponById(inherited)).toBeUndefined();
    }
  });
});
