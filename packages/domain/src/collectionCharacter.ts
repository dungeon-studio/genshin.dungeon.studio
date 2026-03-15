/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';

import type { ISOTimestamp } from './isoTimestamp.js';

export const MIN_CONSTELLATION_LEVEL = 0;
export const MAX_CONSTELLATION_LEVEL = 6;

export interface CollectionCharacter {
  characterId: Character['id'];
  constellationLevel: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export function isValidConstellationLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_CONSTELLATION_LEVEL &&
    value <= MAX_CONSTELLATION_LEVEL
  );
}
