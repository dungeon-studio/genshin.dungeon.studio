// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  CURRENT_VERSION,
  fromDocument,
  toDocument,
  type V1Character,
  type V0Character,
} from './document.js';

const TIMESTAMP = '2024-01-15T12:00:00.000Z';

function makeV1Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    schemaVersion: 1 as const,
    constellationLevel: 3,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V1Character;
  return { ...base, ...overrides };
}

function makeV0Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    constellationLevel: 0,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V0Character;
  return { ...base, ...overrides };
}

describe('fromDocument', () => {
  it('migrates a v0 document (no schemaVersion)', () => {
    const char = fromDocument('columbina', makeV0Document());
    expect(char.constellationLevel).toBe(0);
  });

  it('throws when domain assertion fails (invalid constellation level)', () => {
    expect(() => fromDocument('columbina', makeV1Document({ constellationLevel: 7 }))).toThrow(
      TypeError,
    );
  });
});

describe('toDocument', () => {
  it('stamps the current schema version', () => {
    const char = fromDocument('columbina', makeV1Document());
    const doc = toDocument(char);
    expect(doc.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('round-trips a character through toDocument then fromDocument', () => {
    const char = fromDocument('columbina', makeV1Document());
    const doc = toDocument(char);
    const restored = fromDocument('columbina', doc as unknown as Record<string, unknown>);
    expect(restored).toEqual(char);
  });
});
