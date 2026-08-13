// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { assertCollectionCharacter } from '@genshin/domain';

import { parseDocument } from '@/repositories/schema-version.js';

import { entity, CURRENT_VERSION, type V1Character, type V0Character } from './schemas/index.js';

export { CURRENT_VERSION, type V1Character, type V0Character };

export function fromDocument(
  characterId: string,
  raw: Record<string, unknown>,
): CollectionCharacter {
  const data = parseDocument('characters', entity, raw, CURRENT_VERSION);
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
