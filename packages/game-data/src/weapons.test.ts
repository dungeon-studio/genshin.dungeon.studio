// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { WEAPON_ROSTER } from './weapons.js';

describe('WEAPON_ROSTER', () => {
  it('is not empty', () => {
    // The generator guarantees rarity range and sort order, the record type
    // unique ids. This only catches a generation that silently produced
    // nothing.
    expect(WEAPON_ROSTER.length).toBeGreaterThan(0);
  });
});
