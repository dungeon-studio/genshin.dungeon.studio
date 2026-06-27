// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import {
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  type ISOTimestamp,
  type UUID,
} from '@genshin/domain';
import { WEAPONS } from '@genshin/game-data';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  CURRENT_VERSION,
  fromDocument,
  toDocument,
  type V1Weapon,
  type V0Weapon,
} from './document.js';

const TIMESTAMP = '2024-01-15T12:00:00.000Z';
const WEAPON_INSTANCE_ID = '11111111-1111-1111-1111-111111111111' as UUID;

// toISOString emits a 4-digit year only inside this range; outside it the
// expanded `±YYYYYY` form would not satisfy isISOTimestamp.
const arbTimestamp = fc
  .date({
    min: new Date('0001-01-01T00:00:00.000Z'),
    max: new Date('9999-12-31T23:59:59.999Z'),
    noInvalidDate: true,
  })
  .map((value) => value.toISOString() as ISOTimestamp);

const arbWeapon = fc.record({
  weaponInstanceId: fc.uuid().map((id) => id as UUID),
  weaponId: fc.constantFrom(...WEAPONS.map((weapon) => weapon.id)),
  refinementLevel: fc.integer({ min: MIN_REFINEMENT_LEVEL, max: MAX_REFINEMENT_LEVEL }),
  createdAt: arbTimestamp,
  updatedAt: arbTimestamp,
});

function makeV1Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    schemaVersion: 1 as const,
    weaponId: 'mistsplitter-reforged',
    refinementLevel: 1,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V1Weapon;
  return { ...base, ...overrides };
}

function makeV0Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    weaponId: 'mistsplitter-reforged',
    refinementLevel: 2,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V0Weapon;
  return { ...base, ...overrides };
}

describe('fromDocument', () => {
  it('migrates a v0 document (no schemaVersion)', () => {
    const weapon = fromDocument(WEAPON_INSTANCE_ID, makeV0Document());
    expect(weapon.refinementLevel).toBe(2);
  });

  it('throws when domain assertion fails (invalid refinement level)', () => {
    expect(() => fromDocument(WEAPON_INSTANCE_ID, makeV1Document({ refinementLevel: 6 }))).toThrow(
      TypeError,
    );
  });
});

describe('toDocument', () => {
  it('stamps the current schema version', () => {
    const weapon = fromDocument(WEAPON_INSTANCE_ID, makeV1Document());
    const doc = toDocument(weapon);
    expect(doc.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('round-trips a weapon through toDocument then fromDocument', () => {
    const weapon = fromDocument(WEAPON_INSTANCE_ID, makeV1Document());
    const doc = toDocument(weapon);
    const restored = fromDocument(WEAPON_INSTANCE_ID, doc as unknown as Record<string, unknown>);
    expect(restored).toEqual(weapon);
  });

  it('round-trips any valid weapon (property)', () => {
    fc.assert(
      fc.property(arbWeapon, (weapon) => {
        const restored = fromDocument(
          weapon.weaponInstanceId,
          toDocument(weapon) as unknown as Record<string, unknown>,
        );
        expect(restored).toEqual(weapon);
      }),
    );
  });
});
