// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  assertCollectionWeapon,
  isValidRefinementLevel,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
} from './collectionWeapon.js';
import type { ISOTimestamp } from './isoTimestamp.js';
import type { UUID } from './uuid.js';

const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_WEAPON = {
  weaponInstanceId: 'abc-123' as UUID,
  weaponId: 'mistsplitter-reforged',
  refinementLevel: 1,
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

describe('isValidRefinementLevel', () => {
  it('accepts 1 (minimum)', () => {
    expect(isValidRefinementLevel(MIN_REFINEMENT_LEVEL)).toBe(true);
  });

  it('accepts 5 (maximum)', () => {
    expect(isValidRefinementLevel(MAX_REFINEMENT_LEVEL)).toBe(true);
  });

  it('accepts a value in the middle', () => {
    expect(isValidRefinementLevel(3)).toBe(true);
  });

  it('rejects 0 (below minimum)', () => {
    expect(isValidRefinementLevel(0)).toBe(false);
  });

  it('rejects 6 (above maximum)', () => {
    expect(isValidRefinementLevel(6)).toBe(false);
  });

  it('rejects a float', () => {
    expect(isValidRefinementLevel(2.5)).toBe(false);
  });

  it('rejects a string', () => {
    expect(isValidRefinementLevel('3')).toBe(false);
  });

  it('rejects null', () => {
    expect(isValidRefinementLevel(null)).toBe(false);
  });
});

describe('assertCollectionWeapon', () => {
  it('accepts valid data', () => {
    expect(() => assertCollectionWeapon({ ...VALID_WEAPON })).not.toThrow();
  });

  it('throws for null', () => {
    expect(() => assertCollectionWeapon(null)).toThrow(TypeError);
  });

  it('throws for a non-object', () => {
    expect(() => assertCollectionWeapon('string')).toThrow(TypeError);
  });

  it('throws for missing weaponInstanceId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { weaponInstanceId: _, ...rest } = VALID_WEAPON;
    expect(() => assertCollectionWeapon(rest)).toThrow(/weaponInstanceId/);
  });

  it('throws for missing weaponId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { weaponId: _, ...rest } = VALID_WEAPON;
    expect(() => assertCollectionWeapon(rest)).toThrow(/weaponId/);
  });

  it('throws for unknown weaponId', () => {
    expect(() => assertCollectionWeapon({ ...VALID_WEAPON, weaponId: 'unknown-weapon' })).toThrow(
      /known weapon/,
    );
  });

  it('throws for refinement below minimum', () => {
    expect(() => assertCollectionWeapon({ ...VALID_WEAPON, refinementLevel: 0 })).toThrow(
      /refinementLevel/,
    );
  });

  it('throws for refinement above maximum', () => {
    expect(() => assertCollectionWeapon({ ...VALID_WEAPON, refinementLevel: 6 })).toThrow(
      /refinementLevel/,
    );
  });

  it('throws for invalid createdAt', () => {
    expect(() => assertCollectionWeapon({ ...VALID_WEAPON, createdAt: 'bad-date' })).toThrow(
      /createdAt/,
    );
  });

  it('throws for invalid updatedAt', () => {
    expect(() => assertCollectionWeapon({ ...VALID_WEAPON, updatedAt: 'bad-date' })).toThrow(
      /updatedAt/,
    );
  });
});
