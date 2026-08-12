// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_DATA } from './characters.generated.js';
import type { Element } from './elements.js';
import type { Rarity } from './rarities.js';
import type { WeaponType } from './weapons.js';

export type CharacterId = keyof typeof CHARACTER_DATA;

/**
 * Character definition
 */
export interface Character {
  id: CharacterId;
  name: string;
  element: Element;
  weaponType: WeaponType;
  rarity: Rarity;
  region: string;
  version: string; // Release version (e.g., "1.0", "3.1", "6.7")
  releaseDate: string; // ISO 8601 release date (e.g., "2020-09-28"); exact ordering within a version
}

/**
 * Playable characters with a fixed element. Absent: the Traveler and the
 * Wonderland Manekins, who borrow one, and Aloy, a crossover character.
 *
 * Keyed so a repeated ID is a `tsc` error (TS1117), not a silent overwrite.
 */
export const CHARACTERS: Readonly<Record<CharacterId, Character>> = CHARACTER_DATA;

/** Display order, as the generator writes it: 5-star first, newest version first. */
export const CHARACTER_ROSTER: readonly Character[] = Object.values(CHARACTERS);

/** `hasOwn`, not a bare index: `constructor` and friends sit on every object's prototype. */
function isCharacterId(id: string): id is CharacterId {
  return Object.hasOwn(CHARACTERS, id);
}

export function getCharacterById(id: string): Character | undefined {
  return isCharacterId(id) ? CHARACTERS[id] : undefined;
}
