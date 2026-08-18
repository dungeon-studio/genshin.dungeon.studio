// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  ConstellationLevel,
  ISOTimestamp,
} from '@genshin/domain';

/** The character a save leaves behind, collected once and re-dated after. */
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
