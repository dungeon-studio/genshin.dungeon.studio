// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export type { AuthIdentity } from './authIdentity.js';
export {
  assertCollectionCharacter,
  isValidConstellationLevel,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  type CollectionCharacter,
} from './collectionCharacter.js';
export {
  assertCollectionTeam,
  isValidTeamSlot,
  MAX_TEAM_MEMBERS,
  MAX_TEAM_SLOT,
  MIN_TEAM_SLOT,
  type CollectionTeam,
} from './collectionTeam.js';
export {
  assertCollectionWeapon,
  isValidRefinementLevel,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  type CollectionWeapon,
} from './collectionWeapon.js';
export { isISOTimestamp, type ISOTimestamp } from './isoTimestamp.js';
export type { ProblemDetail } from './problemDetail.js';
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
