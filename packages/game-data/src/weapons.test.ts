// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { WEAPONS } from './weapons.js';

describe('WEAPONS roster', () => {
  it('is not empty', () => {
    // Structural invariants (unique kebab ids, rarity range, sort order) are
    // guaranteed by the generator. This only catches a generation that
    // silently produced nothing.
    expect(WEAPONS.length).toBeGreaterThan(0);
  });
});
