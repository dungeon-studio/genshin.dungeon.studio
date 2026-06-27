// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ISOTimestamp } from '@genshin/domain';
import { CHARACTERS, WEAPONS } from '@genshin/game-data';
import fc from 'fast-check';

// Bound to 4-digit calendar years because that is exactly what isISOTimestamp
// accepts; generated values must satisfy the domain contract before reaching
// the assert* guards. toISOString is the canonical ISO 8601 source — fast-check
// ships no timestamp arbitrary.
export const arbTimestamp = fc
  .date({
    min: new Date('0001-01-01T00:00:00.000Z'),
    max: new Date('9999-12-31T23:59:59.999Z'),
    noInvalidDate: true,
  })
  .map((value) => value.toISOString() as ISOTimestamp);

export const arbCharacterId = fc.constantFrom(...CHARACTERS.map((character) => character.id));

export const arbWeaponId = fc.constantFrom(...WEAPONS.map((weapon) => weapon.id));
