// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_DATA } from './characters.generated.js';
import type { Element } from './elements.js';
import { indexById } from './lookup.js';
import type { Rarity } from './rarities.js';
import type { WeaponType } from './weapons.js';

export type CharacterId = (typeof CHARACTER_DATA)[number]['id'];

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
 */
export const CHARACTERS: readonly Character[] = CHARACTER_DATA;

const CHARACTERS_BY_ID = indexById(CHARACTERS);

/**
 * Helper to find character by ID
 */
export function getCharacterById(id: string): Character | undefined {
  return CHARACTERS_BY_ID.get(id);
}

/**
 * Helper to filter characters by element
 */
export function getCharactersByElement(element: Element): Character[] {
  return CHARACTERS.filter((char) => char.element === element);
}

/**
 * Helper to filter characters by weapon type
 */
export function getCharactersByWeaponType(weaponType: WeaponType): Character[] {
  return CHARACTERS.filter((char) => char.weaponType === weaponType);
}

/**
 * Helper to filter characters by rarity
 */
export function getCharactersByRarity(rarity: Rarity): Character[] {
  return CHARACTERS.filter((char) => char.rarity === rarity);
}

/**
 * Helper to filter characters by version
 */
export function getCharactersByVersion(version: string): Character[] {
  return CHARACTERS.filter((char) => char.version === version);
}
