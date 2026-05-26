// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  assertCollectionCharacter,
  isValidConstellationLevel,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
} from './collection-character.js';
import type { ISOTimestamp } from './iso-timestamp.js';

const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_CHARACTER = {
  characterId: 'columbina',
  constellationLevel: 0,
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

describe('isValidConstellationLevel', () => {
  it('accepts 0 (minimum)', () => {
    expect(isValidConstellationLevel(MIN_CONSTELLATION_LEVEL)).toBe(true);
  });

  it('accepts 6 (maximum)', () => {
    expect(isValidConstellationLevel(MAX_CONSTELLATION_LEVEL)).toBe(true);
  });

  it('accepts a value in the middle', () => {
    expect(isValidConstellationLevel(3)).toBe(true);
  });

  it('rejects -1 (below minimum)', () => {
    expect(isValidConstellationLevel(-1)).toBe(false);
  });

  it('rejects 7 (above maximum)', () => {
    expect(isValidConstellationLevel(7)).toBe(false);
  });

  it('rejects a float', () => {
    expect(isValidConstellationLevel(2.5)).toBe(false);
  });

  it('rejects a string', () => {
    expect(isValidConstellationLevel('3')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidConstellationLevel(null)).toBe(false);
  });
});

describe('assertCollectionCharacter', () => {
  it('accepts valid data', () => {
    expect(() => assertCollectionCharacter({ ...VALID_CHARACTER })).not.toThrow();
  });

  it('throws for null', () => {
    expect(() => assertCollectionCharacter(null)).toThrow(TypeError);
  });

  it('throws for a non-object', () => {
    expect(() => assertCollectionCharacter('string')).toThrow(TypeError);
  });

  it('throws for missing characterId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { characterId: _, ...rest } = VALID_CHARACTER;
    expect(() => assertCollectionCharacter(rest)).toThrow(/characterId/);
  });

  it('throws for unknown characterId', () => {
    expect(() =>
      assertCollectionCharacter({ ...VALID_CHARACTER, characterId: 'unknown-character' }),
    ).toThrow(/known character/);
  });

  it('throws for constellation below minimum', () => {
    expect(() => assertCollectionCharacter({ ...VALID_CHARACTER, constellationLevel: -1 })).toThrow(
      /constellationLevel/,
    );
  });

  it('throws for constellation above maximum', () => {
    expect(() => assertCollectionCharacter({ ...VALID_CHARACTER, constellationLevel: 7 })).toThrow(
      /constellationLevel/,
    );
  });

  it('throws for invalid createdAt', () => {
    expect(() => assertCollectionCharacter({ ...VALID_CHARACTER, createdAt: 'bad-date' })).toThrow(
      /createdAt/,
    );
  });

  it('throws for invalid updatedAt', () => {
    expect(() => assertCollectionCharacter({ ...VALID_CHARACTER, updatedAt: 'bad-date' })).toThrow(
      /updatedAt/,
    );
  });
});
