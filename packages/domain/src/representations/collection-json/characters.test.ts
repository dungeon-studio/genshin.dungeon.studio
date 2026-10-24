// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  characterItemDocument,
  characterListDocument,
  characterRepresentation,
  deserialiseCharacter,
  serialiseCharacter,
} from './characters.js';
import type { CollectionCharacter } from '../../character/collection-character.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';

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
    expect(item.href).toBe(`${BASE_URL}/characters/columbina`);
  });

  it('preserves constellation level through round-trip', () => {
    const character: CollectionCharacter = { ...VALID_CHARACTER, constellationLevel: 6 };
    const item = serialiseCharacter(character, BASE_URL);
    const result = deserialiseCharacter(item);
    expect(result.constellationLevel).toBe(6);
  });
});

describe('deserialiseCharacter sanitisation', () => {
  it('strips unknown data entries off the deserialised character', () => {
    const item = serialiseCharacter(VALID_CHARACTER, BASE_URL);
    const injected = { ...item, data: [...item.data, { name: 'injected', value: 'evil' }] };
    expect(deserialiseCharacter(injected)).toEqual(VALID_CHARACTER);
  });
});

describe('characterListDocument', () => {
  it('addresses the collection URL', () => {
    const document = characterListDocument([VALID_CHARACTER], BASE_URL);
    expect(document.collection.href).toBe(`${BASE_URL}/characters`);
  });

  it('holds one item per character in order', () => {
    const other: CollectionCharacter = { ...VALID_CHARACTER, characterId: 'durin' };
    const document = characterListDocument([VALID_CHARACTER, other], BASE_URL);
    expect(document.collection.items.map((item) => item.href)).toEqual([
      `${BASE_URL}/characters/columbina`,
      `${BASE_URL}/characters/durin`,
    ]);
  });

  it('carries the character template', () => {
    const document = characterListDocument([], BASE_URL);
    expect(document.collection.template).toEqual(characterRepresentation.template);
  });
});

describe('characterItemDocument', () => {
  it("addresses the character's own URL", () => {
    const document = characterItemDocument(VALID_CHARACTER, BASE_URL);
    expect(document.collection.href).toBe(`${BASE_URL}/characters/columbina`);
  });

  it('holds only that character', () => {
    const document = characterItemDocument(VALID_CHARACTER, BASE_URL);
    expect(document.collection.items.map((item) => item.href)).toEqual([
      `${BASE_URL}/characters/columbina`,
    ]);
  });

  it('carries the character template', () => {
    const document = characterItemDocument(VALID_CHARACTER, BASE_URL);
    expect(document.collection.template).toEqual(characterRepresentation.template);
  });
});
