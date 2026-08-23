/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Weapon } from '@genshin/game-data';
import { getWeaponById } from '@genshin/game-data';

import type { ISOTimestamp } from '../iso-timestamp.js';
import { isISOTimestamp } from '../iso-timestamp.js';

export const MIN_REFINEMENT_LEVEL = 1;
export const MAX_REFINEMENT_LEVEL = 5;

/** Refinement of one weapon instance, one rank per duplicate copy consumed. */
export type RefinementLevel = 1 | 2 | 3 | 4 | 5;

export const REFINEMENT_LEVELS: readonly RefinementLevel[] = Array.from(
  { length: MAX_REFINEMENT_LEVEL - MIN_REFINEMENT_LEVEL + 1 },
  (_, i) => (MIN_REFINEMENT_LEVEL + i) as RefinementLevel,
);

/**
 * Identifier for one weapon instance in a user's collection.
 *
 * The API mints these with `randomUUID`, but the served profiles constrain the
 * field to a non-empty string rather than a UUID format, so nothing may rely on
 * the shape. Equality is the only operation performed on it.
 */
export type CollectionWeaponId = string;

/**
 * One weapon instance a user owns, as stored and as served.
 *
 * A user can own several copies of the same weapon at different refinements,
 * so `weaponInstanceId` rather than `weaponId` identifies the record.
 * Everything intrinsic to the weapon is looked up from `@genshin/game-data` by
 * `weaponId` rather than copied here.
 */
export interface CollectionWeapon {
  weaponInstanceId: CollectionWeaponId;
  weaponId: Weapon['id'];
  refinementLevel: RefinementLevel;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export function isValidRefinementLevel(value: unknown): value is RefinementLevel {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_REFINEMENT_LEVEL &&
    value <= MAX_REFINEMENT_LEVEL
  );
}

/**
 * Asserts a value read from storage or a request body is a `CollectionWeapon`.
 *
 * `weaponId` is checked against the shipped catalogue, not just for being a
 * string, so a record naming a weapon `@genshin/game-data` hasn't shipped
 * fails here. A stored record can therefore start failing after a catalogue
 * change alone.
 *
 * @throws TypeError naming the field that failed.
 */
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
