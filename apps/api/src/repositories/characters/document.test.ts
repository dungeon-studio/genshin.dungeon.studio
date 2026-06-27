// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import {
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  type ISOTimestamp,
} from '@genshin/domain';
import { CHARACTERS } from '@genshin/game-data';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  CURRENT_VERSION,
  fromDocument,
  toDocument,
  type V1Character,
  type V0Character,
} from './document.js';

const TIMESTAMP = '2024-01-15T12:00:00.000Z';

// toISOString emits a 4-digit year only inside this range; outside it the
// expanded `±YYYYYY` form would not satisfy isISOTimestamp.
const arbTimestamp = fc
  .date({
    min: new Date('0001-01-01T00:00:00.000Z'),
    max: new Date('9999-12-31T23:59:59.999Z'),
    noInvalidDate: true,
  })
  .map((value) => value.toISOString() as ISOTimestamp);

const arbCharacter = fc.record({
  characterId: fc.constantFrom(...CHARACTERS.map((character) => character.id)),
  constellationLevel: fc.integer({
    min: MIN_CONSTELLATION_LEVEL,
    max: MAX_CONSTELLATION_LEVEL,
  }),
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
    const restored = fromDocument('columbina', doc as unknown as Record<string, unknown>);
    expect(restored).toEqual(char);
  });

  it('round-trips any valid character (property)', () => {
    fc.assert(
      fc.property(arbCharacter, (character) => {
        const restored = fromDocument(
          character.characterId,
          toDocument(character) as unknown as Record<string, unknown>,
        );
        expect(restored).toEqual(character);
      }),
    );
  });
});
