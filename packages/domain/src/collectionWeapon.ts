/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Weapon } from '@genshin/game-data';
import { getWeaponById } from '@genshin/game-data';

import type { ISOTimestamp } from './isoTimestamp.js';
import { isISOTimestamp } from './isoTimestamp.js';
import type { UUID } from './uuid.js';

export const MIN_REFINEMENT_LEVEL = 1;
export const MAX_REFINEMENT_LEVEL = 5;

export interface CollectionWeapon {
  weaponInstanceId: UUID;
  weaponId: Weapon['id'];
  refinementLevel: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export type CollectionWeaponId = CollectionWeapon['weaponInstanceId'];

export function isValidRefinementLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_REFINEMENT_LEVEL &&
    value <= MAX_REFINEMENT_LEVEL
  );
}

export function assertCollectionWeapon(value: unknown): asserts value is CollectionWeapon {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(
      `CollectionWeapon must be a non-null object, got: ${JSON.stringify(value)}`,
    );
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.weaponInstanceId !== 'string') {
    throw new TypeError(
      `CollectionWeapon.weaponInstanceId must be a string, got: ${JSON.stringify(obj.weaponInstanceId)}`,
    );
  }
  if (typeof obj.weaponId !== 'string') {
    throw new TypeError(
      `CollectionWeapon.weaponId must be a string, got: ${JSON.stringify(obj.weaponId)}`,
    );
  }
  if (!getWeaponById(obj.weaponId)) {
    throw new TypeError(
      `CollectionWeapon.weaponId must be a known weapon, got: ${JSON.stringify(obj.weaponId)}`,
    );
  }
  if (!isValidRefinementLevel(obj.refinementLevel)) {
    throw new TypeError(
      `CollectionWeapon.refinementLevel must be an integer between ${MIN_REFINEMENT_LEVEL} and ${MAX_REFINEMENT_LEVEL}, got: ${JSON.stringify(obj.refinementLevel)}`,
    );
  }
  if (!isISOTimestamp(obj.createdAt)) {
    throw new TypeError(
      `CollectionWeapon.createdAt must be an ISO 8601 timestamp, got: ${JSON.stringify(obj.createdAt)}`,
    );
  }
  if (!isISOTimestamp(obj.updatedAt)) {
    throw new TypeError(
      `CollectionWeapon.updatedAt must be an ISO 8601 timestamp, got: ${JSON.stringify(obj.updatedAt)}`,
    );
  }
}
