// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_DATA } from './characters.generated.js';
import type { Element } from './elements.js';
import { findById } from './lookup.js';
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
 * Playable characters with a fixed element, by ID. Absent: the Traveler and
 * the Wonderland Manekins, who borrow one, and Aloy, a crossover character.
 *
 * Keying by ID is what makes the IDs unique: a repeat is a duplicate property
 * in the generated object literal, which `tsc` rejects (TS1117).
 */
export const CHARACTERS: Readonly<Record<CharacterId, Character>> = CHARACTER_DATA;

/**
 * Characters in display order: 5-star first, then newest version first.
 *
 * The generator writes the catalogue in that order and object keys keep their
 * insertion order, so this view cannot disagree with `CHARACTERS` about which
 * characters exist.
 */
export const CHARACTER_ROSTER: readonly Character[] = Object.values(CHARACTERS);

/**
 * Helper to find character by ID
 */
export function getCharacterById(id: string): Character | undefined {
  return findById(CHARACTERS, id);
}

/**
 * Helper to filter characters by element
 */
export function getCharactersByElement(element: Element): Character[] {
  return CHARACTER_ROSTER.filter((char) => char.element === element);
}

/**
 * Helper to filter characters by weapon type
 */
export function getCharactersByWeaponType(weaponType: WeaponType): Character[] {
  return CHARACTER_ROSTER.filter((char) => char.weaponType === weaponType);
}

/**
 * Helper to filter characters by rarity
 */
export function getCharactersByRarity(rarity: Rarity): Character[] {
  return CHARACTER_ROSTER.filter((char) => char.rarity === rarity);
}

/**
 * Helper to filter characters by version
 */
export function getCharactersByVersion(version: string): Character[] {
  return CHARACTER_ROSTER.filter((char) => char.version === version);
}
