// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { assertCollectionCharacter } from '@genshin/domain';

import { entity, CURRENT_VERSION, type V1Character, type V0Character } from './schemas/index.js';

export { CURRENT_VERSION, type V1Character, type V0Character };

export function fromDocument(
  characterId: string,
  raw: Record<string, unknown>,
): CollectionCharacter {
  const result = entity.safeParse(raw);
  if (result.type !== 'ok') {
    throw new TypeError(`Invalid character document: ${result.error.type}`);
  }
  const data = result.value;
  const character = {
    characterId,
    constellationLevel: data.constellationLevel,
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
  assertCollectionCharacter(character);
  return character;
}

export function toDocument(character: CollectionCharacter): V1Character {
  return {
    schemaVersion: CURRENT_VERSION,
    constellationLevel: character.constellationLevel,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}
