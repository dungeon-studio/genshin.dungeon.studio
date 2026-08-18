// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { CHARACTER_ROSTER } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { nextCharacter } from './merge.js';

const CHARACTER = CHARACTER_ROSTER[0];
const CREATED_AT = '2026-01-01T00:00:00.000Z' as ISOTimestamp;
const NOW = '2026-01-02T00:00:00.000Z' as ISOTimestamp;

const stored = {
  characterId: CHARACTER.id,
  constellationLevel: 1,
  createdAt: CREATED_AT,
  updatedAt: CREATED_AT,
} satisfies CollectionCharacter;

describe('nextCharacter', () => {
  it('dates a character nothing ever collected to the save', () => {
    expect(nextCharacter(CHARACTER.id, 1, null, NOW).createdAt).toBe(NOW);
  });

  it('keeps the createdAt of a character already collected', () => {
    expect(nextCharacter(CHARACTER.id, 4, stored, NOW).createdAt).toBe(CREATED_AT);
  });
});
