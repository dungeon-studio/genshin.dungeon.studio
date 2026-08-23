// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { assertCollectionCharacter } from '@genshin/domain';

import { parseDocument } from '@/repositories/schema-version.js';

import { entity, CURRENT_VERSION, type V1Character, type V0Character } from './schemas/index.js';

export { CURRENT_VERSION, type V1Character, type V0Character };

/**
 * Reads a stored character, migrating it forward from whatever version it was
 * written in.
 *
 * The identity is the document key, so the caller passes it in rather than the
 * payload carrying it. Domain invariants are asserted after the migration, so a
 * document that parses but names a character no longer in the roster fails
 * here.
 *
 * @throws TypeError when no known version accepts the document, or when the
 * migrated result breaks a domain invariant.
 */
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

/**
 * Writes a character in the current version, leaving the identity to the
 * document key.
 *
 * Always stamps `CURRENT_VERSION`, so any read-modify-write upgrades a document
 * that was stored under an older one.
 */
export function toDocument(character: CollectionCharacter): V1Character {
  return {
    schemaVersion: CURRENT_VERSION,
    constellationLevel: character.constellationLevel,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}
