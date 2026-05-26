// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import type { CollectionCharacter } from '../../collection-character.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';
import { deserialiseCharacter, serialiseCharacter } from './characters.js';

const BASE_URL = 'http://localhost:8080';
const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_CHARACTER: CollectionCharacter = {
  characterId: 'columbina',
  constellationLevel: 3,
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

describe('character serialisation round-trip', () => {
  it('deserialises a serialised character back to the original', () => {
    const item = serialiseCharacter(VALID_CHARACTER, BASE_URL);
    const result = deserialiseCharacter(item);
    expect(result).toEqual(VALID_CHARACTER);
  });

  it('serialises with the correct href', () => {
    const item = serialiseCharacter(VALID_CHARACTER, BASE_URL);
    expect(item.href).toBe(`${BASE_URL}/api/characters/columbina`);
  });

  it('preserves constellation level through round-trip', () => {
    const character: CollectionCharacter = { ...VALID_CHARACTER, constellationLevel: 6 };
    const item = serialiseCharacter(character, BASE_URL);
    const result = deserialiseCharacter(item);
    expect(result.constellationLevel).toBe(6);
  });
});
