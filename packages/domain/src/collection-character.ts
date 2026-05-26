/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';
import { getCharacterById } from '@genshin/game-data';

import type { ISOTimestamp } from './iso-timestamp.js';
import { isISOTimestamp } from './iso-timestamp.js';

export const MIN_CONSTELLATION_LEVEL = 0;
export const MAX_CONSTELLATION_LEVEL = 6;

export interface CollectionCharacter {
  characterId: Character['id'];
  constellationLevel: number;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export type CharacterId = CollectionCharacter['characterId'];

export function isValidConstellationLevel(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_CONSTELLATION_LEVEL &&
    value <= MAX_CONSTELLATION_LEVEL
  );
}

export function assertCollectionCharacter(value: unknown): asserts value is CollectionCharacter {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(
      `CollectionCharacter must be a non-null object, got: ${JSON.stringify(value)}`,
    );
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.characterId !== 'string') {
    throw new TypeError(
      `CollectionCharacter.characterId must be a string, got: ${JSON.stringify(obj.characterId)}`,
    );
  }
  if (!getCharacterById(obj.characterId)) {
    throw new TypeError(
      `CollectionCharacter.characterId must be a known character, got: ${JSON.stringify(obj.characterId)}`,
    );
  }
  if (!isValidConstellationLevel(obj.constellationLevel)) {
    throw new TypeError(
      `CollectionCharacter.constellationLevel must be an integer between ${MIN_CONSTELLATION_LEVEL} and ${MAX_CONSTELLATION_LEVEL}, got: ${JSON.stringify(obj.constellationLevel)}`,
    );
  }
  if (!isISOTimestamp(obj.createdAt)) {
    throw new TypeError(
      `CollectionCharacter.createdAt must be an ISO 8601 timestamp, got: ${JSON.stringify(obj.createdAt)}`,
    );
  }
  if (!isISOTimestamp(obj.updatedAt)) {
    throw new TypeError(
      `CollectionCharacter.updatedAt must be an ISO 8601 timestamp, got: ${JSON.stringify(obj.updatedAt)}`,
    );
  }
}
