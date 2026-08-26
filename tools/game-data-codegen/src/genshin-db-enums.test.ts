// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { toWeaponType } from './genshin-db-enums.js';

describe('genshin-db enum translation', () => {
  // The generators only reach this path when upstream ships a value no table
  // maps, which no roster in the pinned release can reproduce.
  it('names the unmapped value and the record carrying it', () => {
    expect(() => toWeaponType('WEAPON_TRIDENT', 'Odette')).toThrow(
      'Unknown weapon type "WEAPON_TRIDENT" for Odette',
    );
  });
});
