// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export type { AuthIdentity } from './authIdentity.js';
export {
  isValidConstellationLevel,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  type CollectionCharacter,
} from './collectionCharacter.js';
export {
  isValidRefinementLevel,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  type CollectionWeapon,
} from './collectionWeapon.js';
export type { ISOTimestamp } from './isoTimestamp.js';
export {
  characterItemHref,
  characterRepresentation,
  deserialiseCharacter,
  serialiseCharacter,
} from './representations/collection-json/characters.js';
export {
  deserialiseWeapon,
  serialiseWeapon,
  weaponItemHref,
  weaponRepresentation,
} from './representations/collection-json/weapons.js';
export {
  deserialiseProfile,
  serialiseProfile,
  type ProfileResponse,
} from './representations/json/profile.js';
export type { Team, TeamSlot } from './team.js';
export type { ArtifactPlan, TeamMember } from './teamMember.js';
export { type ProfileUpdate, type UserProfile } from './userProfile.js';
export type { UUID } from './uuid.js';
