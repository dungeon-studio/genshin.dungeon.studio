// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * @genshin/game-data
 *
 * Structured game data for Genshin Impact including characters, weapons,
 * elements, and artifact sets.
 */

// Elements
export {
  ELEMENTS,
  ELEMENT_REACTION_TYPES,
  REACTION_TYPES,
  getReactionsByVersion,
  type Element,
  type ReactionType,
} from './elements.js';

// Rarities
export type { Rarity } from './rarities.js';

// Characters
export {
  CHARACTERS,
  getCharacterById,
  getCharactersByElement,
  getCharactersByRarity,
  getCharactersByVersion,
  getCharactersByWeaponType,
  type Character,
} from './characters.js';

// Weapons
export {
  WEAPONS,
  WEAPON_STAT_TYPES,
  WEAPON_TYPES,
  getWeaponById,
  getWeaponsByRarity,
  getWeaponsByType,
  getWeaponsByVersion,
  type Weapon,
  type WeaponStatType,
  type WeaponType,
} from './weapons.js';

// Artifacts
export {
  ARTIFACT_PIECES,
  ARTIFACT_SETS,
  getArtifactSetById,
  getArtifactSetsByVersion,
  type ArtifactPiece,
  type ArtifactSet,
} from './artifacts.js';

// Versions
export { compareVersions } from './versions.js';
