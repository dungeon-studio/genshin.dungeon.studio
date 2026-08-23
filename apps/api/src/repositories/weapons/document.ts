// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/domain';
import { assertCollectionWeapon } from '@genshin/domain';

import { parseDocument } from '@/repositories/schema-version.js';

import { entity, CURRENT_VERSION, type V1Weapon, type V0Weapon } from './schemas/index.js';

export { CURRENT_VERSION, type V1Weapon, type V0Weapon };

/**
 * Reads a stored weapon instance, migrating it forward from whatever version it
 * was written in.
 *
 * The identity is the document key, so the caller passes it in rather than the
 * payload carrying it. Domain invariants are asserted after the migration, so a
 * document that parses but names a weapon no longer in the catalogue fails
 * here.
 *
 * @throws TypeError when no known version accepts the document, or when the
 * migrated result breaks a domain invariant.
 */
export function fromDocument(
  weaponInstanceId: UUID,
  raw: Record<string, unknown>,
): CollectionWeapon {
  const data = parseDocument('weapons', entity, raw, CURRENT_VERSION);
  const weapon = {
    weaponInstanceId,
    weaponId: data.weaponId,
    refinementLevel: data.refinementLevel,
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
  assertCollectionWeapon(weapon);
  return weapon;
}

/**
 * Writes a weapon instance in the current version, leaving the identity to the
 * document key.
 *
 * Always stamps `CURRENT_VERSION`, so any read-modify-write upgrades a document
 * that was stored under an older one.
 */
export function toDocument(weapon: CollectionWeapon): V1Weapon {
  return {
    schemaVersion: CURRENT_VERSION,
    weaponId: weapon.weaponId,
    refinementLevel: weapon.refinementLevel,
    createdAt: weapon.createdAt,
    updatedAt: weapon.updatedAt,
  };
}
