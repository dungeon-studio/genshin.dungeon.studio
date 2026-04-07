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
  ELEMENT_REACTION_TYPES,
  ELEMENTS,
  getReactionsByVersion,
  REACTION_TYPES,
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
  getWeaponById,
  getWeaponsByRarity,
  getWeaponsByType,
  getWeaponsByVersion,
  WEAPON_STAT_TYPES,
  WEAPON_TYPES,
  WEAPONS,
  type Weapon,
  type WeaponStatType,
  type WeaponType,
} from './weapons.js';

// Artifacts
export {
  ARTIFACT_MINOR_AFFIXES,
  ARTIFACT_PIECES,
  ARTIFACT_SETS,
  CIRCLET_MAIN_AFFIXES,
  getArtifactSetById,
  getArtifactSetsByVersion,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
  type ArtifactMainAffix,
  type ArtifactMinorAffix,
  type ArtifactPiece,
  type ArtifactSet,
  type CircletMainAffix,
  type GobletMainAffix,
  type SandsMainAffix,
} from './artifacts.js';

// Versions
export { compareVersions, GAME_DATA_VERSION } from './versions.js';
