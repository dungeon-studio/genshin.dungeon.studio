// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/domain';
import { assertCollectionWeapon } from '@genshin/domain';

import { entity, CURRENT_VERSION, type V1Weapon, type V0Weapon } from './schemas/index.js';

export { CURRENT_VERSION, type V1Weapon, type V0Weapon };

export function fromDocument(
  weaponInstanceId: UUID,
  raw: Record<string, unknown>,
): CollectionWeapon {
  const result = entity.safeParse(raw);
  if (result.type !== 'ok') {
    throw new TypeError(`Invalid weapon document: ${result.error.type}`);
  }
  const data = result.value;
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

export function toDocument(weapon: CollectionWeapon): V1Weapon {
  return {
    schemaVersion: CURRENT_VERSION,
    weaponId: weapon.weaponId,
    refinementLevel: weapon.refinementLevel,
    createdAt: weapon.createdAt,
    updatedAt: weapon.updatedAt,
  };
}
