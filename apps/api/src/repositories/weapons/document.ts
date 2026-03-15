// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, ISOTimestamp, UUID } from '@genshin/domain';

export interface DocumentData {
  weaponId: string;
  refinementLevel: number;
  createdAt: string;
  updatedAt: string;
}

export function fromDocument(weaponInstanceId: UUID, data: DocumentData): CollectionWeapon {
  return {
    weaponInstanceId,
    weaponId: data.weaponId,
    refinementLevel: data.refinementLevel,
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
}

export function toDocument(weapon: CollectionWeapon): DocumentData {
  return {
    weaponId: weapon.weaponId,
    refinementLevel: weapon.refinementLevel,
    createdAt: weapon.createdAt,
    updatedAt: weapon.updatedAt,
  };
}
