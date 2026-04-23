// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  CURRENT_VERSION,
  fromDocument,
  toDocument,
  type V1Profile,
  type V0Profile,
} from './document.js';

const TIMESTAMP = '2024-01-15T12:00:00.000Z';

function makeV1Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    schemaVersion: 1 as const,
    name: 'Traveler',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V1Profile;
  return { ...base, ...overrides };
}

function makeV0Document(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const base = {
    name: 'Old Traveler',
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  } satisfies V0Profile;
  return { ...base, ...overrides };
}

describe('fromDocument', () => {
  it('migrates a v0 document (no schemaVersion)', () => {
    const profile = fromDocument(makeV0Document());
    expect(profile.name).toBe('Old Traveler');
  });

  it('throws when domain assertion fails (invalid timestamp)', () => {
    expect(() => fromDocument(makeV1Document({ createdAt: 'not-a-date' }))).toThrow(TypeError);
  });
});

describe('toDocument', () => {
  it('stamps the current schema version', () => {
    const profile = fromDocument(makeV1Document());
    const doc = toDocument(profile);
    expect(doc.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('round-trips a profile through toDocument then fromDocument', () => {
    const profile = fromDocument(makeV1Document());
    const doc = toDocument(profile);
    const restored = fromDocument(doc as unknown as Record<string, unknown>);
    expect(restored).toEqual(profile);
  });
});
