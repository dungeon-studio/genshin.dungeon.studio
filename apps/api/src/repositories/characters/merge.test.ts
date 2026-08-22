// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ISOTimestamp } from '@genshin/domain';
import { makeCharacter } from '@genshin/domain/testing';
import { CHARACTER_ROSTER } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { nextCharacter } from './merge.js';

const CHARACTER = CHARACTER_ROSTER[0];
const NOW = '2026-01-02T00:00:00.000Z' as ISOTimestamp;

const stored = makeCharacter(CHARACTER.id, { constellationLevel: 1 });

describe('nextCharacter', () => {
  it('dates a character nothing ever collected to the save', () => {
    expect(nextCharacter(CHARACTER.id, 1, null, NOW).createdAt).toBe(NOW);
  });

  it('keeps the createdAt of a character already collected', () => {
    expect(nextCharacter(CHARACTER.id, 4, stored, NOW).createdAt).toBe(stored.createdAt);
  });
});
