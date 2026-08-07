// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

export { issue, isValid, prefixPaths, type ValidationIssue } from '@genshin/validation';
export { type ArtifactPlan } from './artifact/artifact-plan.js';
export { validateArtifactPlan } from './artifact/artifact-plan-validation.js';
export type { AuthIdentity } from './profile/auth-identity.js';
export {
  assertCollectionCharacter,
  CONSTELLATION_LEVELS,
  isValidConstellationLevel,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
  type CharacterId,
  type CollectionCharacter,
  type ConstellationLevel,
} from './character/collection-character.js';
export {
  assertCollectionTeam,
  createEmptyTeam,
  defaultTeamName,
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
} from './team/collection-team.js';
export { type CollectionTeamMember } from './team/collection-team-member.js';
export {
  assertCollectionWeapon,
  isValidRefinementLevel,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  type CollectionWeapon,
  type CollectionWeaponId,
} from './weapon/collection-weapon.js';
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
  deserialiseProfile,
  serialiseProfile,
  type ProfileResponse,
} from './representations/json/profile.js';

export { validateTeam, validateTeams, type TeamValidationContext } from './team/team-validation.js';
export { assertUserProfile, type ProfileUpdate, type UserProfile } from './profile/user-profile.js';
export type { UUID } from './uuid.js';
