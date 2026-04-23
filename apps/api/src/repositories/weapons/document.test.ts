// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { UUID } from '@genshin/domain';
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
});
