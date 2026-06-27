// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export { issue, isValid, prefixPaths, type ValidationIssue } from '@genshin/validation';
export { type ArtifactPlan } from './artifact-plan.js';
export { validateArtifactPlan } from './artifact-plan-validation.js';
export type { AuthIdentity } from './auth-identity.js';
export {
  assertCollectionCharacter,
  isValidConstellationLevel,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  type CharacterId,
  type CollectionCharacter,
} from './collection-character.js';
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
} from './collection-team.js';
export { type CollectionTeamMember } from './collection-team-member.js';
export {
  assertCollectionWeapon,
  isValidRefinementLevel,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  type CollectionWeapon,
  type CollectionWeaponId,
} from './collection-weapon.js';
export { isISOTimestamp, nowTimestamp, type ISOTimestamp } from './iso-timestamp.js';
export type { ProblemDetail } from './problem-detail.js';
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
  CURRENT_VERSION as PROFILE_RESPONSE_VERSION,
  deserialiseProfile,
  serialiseProfile,
  type ProfileResponse,
  type V0ProfileResponse,
  type V1ProfileResponse,
} from './representations/json/profile.js';

export { validateTeam, validateTeams, type TeamValidationContext } from './team-validation.js';
export { assertUserProfile, type ProfileUpdate, type UserProfile } from './user-profile.js';
export type { UUID } from './uuid.js';
