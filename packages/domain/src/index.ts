// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export { issue, isValid, prefixPaths, type ValidationIssue } from '@genshin/validation';
export { type ArtifactPlan } from './artifactPlan.js';
export { validateArtifactPlan } from './artifactPlanValidation.js';
export type { AuthIdentity } from './authIdentity.js';
export {
  assertCollectionCharacter,
  isValidConstellationLevel,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  type CharacterId,
  type CollectionCharacter,
} from './collectionCharacter.js';
export {
  assertCollectionTeam,
  createEmptyTeam,
  initialTeams,
  isValidMemberIndex,
  isValidTeamSlot,
  MAX_TEAM_MEMBERS,
  MAX_TEAM_SLOT,
  MIN_TEAM_SLOT,
  TEAM_SLOTS,
  type CollectionTeam,
  type CollectionTeamMembers,
  type TeamSlot,
} from './collectionTeam.js';
export { type CollectionTeamMember } from './collectionTeamMember.js';
export {
  assertCollectionWeapon,
  isValidRefinementLevel,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  type CollectionWeapon,
  type CollectionWeaponId,
} from './collectionWeapon.js';
export { isISOTimestamp, nowTimestamp, type ISOTimestamp } from './isoTimestamp.js';
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

export { validateTeam, validateTeams, type TeamValidationContext } from './teamValidation.js';
export { type ProfileUpdate, type UserProfile } from './userProfile.js';
export type { UUID } from './uuid.js';
