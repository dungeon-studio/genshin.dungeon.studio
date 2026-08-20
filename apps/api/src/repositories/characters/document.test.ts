// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CONSTELLATION_LEVELS } from '@genshin/domain';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { arbCharacterId, arbTimestamp } from '@/test/arbitraries.js';

import {
  CURRENT_VERSION,
  fromDocument,
  toDocument,
  type V1Character,
  type V0Character,
} from './document.js';

const TIMESTAMP = '2024-01-15T12:00:00.000Z';

const arbCharacter = fc.record({
  characterId: arbCharacterId,
  constellationLevel: fc.constantFrom(...CONSTELLATION_LEVELS),
  createdAt: arbTimestamp,
  updatedAt: arbTimestamp,
});

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
    const restored = fromDocument('columbina', doc);
    expect(restored).toEqual(char);
  });

  it('round-trips any valid character (property)', () => {
    fc.assert(
      fc.property(arbCharacter, (character) => {
        const restored = fromDocument(character.characterId, toDocument(character));
        expect(restored).toEqual(character);
      }),
    );
  });
});
