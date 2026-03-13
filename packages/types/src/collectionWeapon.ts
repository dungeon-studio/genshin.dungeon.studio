/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Weapon } from '@genshin/game-data';

import type { ISOTimestamp } from './isoTimestamp.js';
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

export function isValidRefinementLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_REFINEMENT_LEVEL &&
    value <= MAX_REFINEMENT_LEVEL
  );
}
