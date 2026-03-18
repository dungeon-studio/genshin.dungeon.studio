// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export type { AuthIdentity } from './authIdentity.js';
export {
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  assertCollectionCharacter,
  isValidConstellationLevel,
  type CollectionCharacter,
} from './collectionCharacter.js';
export {
  MAX_TEAM_MEMBERS,
  MAX_TEAM_SLOT,
  MIN_TEAM_SLOT,
  assertCollectionTeam,
  isValidTeamSlot,
  type CollectionTeam,
} from './collectionTeam.js';
export {
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  assertCollectionWeapon,
  isValidRefinementLevel,
  type CollectionWeapon,
} from './collectionWeapon.js';
export { isISOTimestamp, type ISOTimestamp } from './isoTimestamp.js';
export {
  characterItemHref,
  characterRepresentation,
  deserialiseCharacter,
  serialiseCharacter,
} from './representations/collection-json/characters.js';
export {
  deserialiseTeam,
  serialiseTeam,
  teamItemDocument,
  teamItemHref,
  teamListDocument,
  teamRepresentation,
} from './representations/collection-json/teams.js';
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
