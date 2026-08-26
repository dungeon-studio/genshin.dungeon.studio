// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { toWeaponType } from './genshin-db-enums.js';

describe('genshin-db enum translation', () => {
  // No roster in the pinned release carries an unmapped value, so a direct call
  // is the only way to reach this path.
  it('names the unmapped value and the record carrying it', () => {
    expect(() => toWeaponType('WEAPON_TRIDENT', 'Odette')).toThrow(
      'Unknown weapon type "WEAPON_TRIDENT" for Odette',
    );
  });
});
