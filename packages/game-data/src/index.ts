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
  ARTIFACT_PIECES,
  ARTIFACT_SETS,
  getArtifactSetById,
  getArtifactSetsByVersion,
  type ArtifactPiece,
  type ArtifactSet,
} from './artifacts.js';
