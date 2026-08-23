// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_DATA } from './characters.generated.js';
import type { Element } from './elements.js';
import type { Rarity } from './rarities.js';
import type { WeaponType } from './weapons.js';

/**
 * The IDs this package currently ships, as a union.
 *
 * Derived from generated data, so regenerating narrows or widens it. An ID held
 * outside the type system, such as one read from storage, is checked with
 * `getCharacterById` rather than cast.
 */
export type CharacterId = keyof typeof CHARACTER_DATA;

/**
 * One character as the game defines them, the same for every player.
 *
 * `CollectionCharacter` in `@genshin/domain` is the other half: what a
 * particular user owns. Nothing a user can change belongs here.
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

/**
 * Looks a character up by ID, taking a plain string so a caller can hand over
 * stored or user input directly.
 *
 * `undefined` means the ID is outside this package's roster, which a character
 * the game has since added also produces. A caller rendering a saved
 * collection has to treat that as data it can't render yet rather than as
 * invalid input.
 */
export function getCharacterById(id: string): Character | undefined {
  return isCharacterId(id) ? CHARACTERS[id] : undefined;
}
