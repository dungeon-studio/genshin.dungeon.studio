// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  ConstellationLevel,
  ISOTimestamp,
} from '@genshin/domain';

/**
 * The character record to store, from a full replacement and whatever was
 * already there.
 *
 * Unlike a team, a character has one mutable field, so the caller supplies it
 * outright rather than as an optional update. Only the timestamps merge:
 * `createdAt` survives while `updatedAt` always moves.
 */
export function nextCharacter(
  characterId: CharacterId,
  constellationLevel: ConstellationLevel,
  existing: CollectionCharacter | null,
  now: ISOTimestamp,
): CollectionCharacter {
  return {
    characterId,
    constellationLevel,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}
