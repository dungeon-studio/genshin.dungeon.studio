/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * The rules a team has to satisfy beyond its shape, which
 * `assertCollectionTeam` covers.
 *
 * Collects issues rather than throwing on the first, because the caller is a
 * form that shows every field's message at once. Nothing here reads storage: a
 * check that needs to know what the user owns takes a
 * {@link TeamValidationContext} the caller has already populated, from the
 * zustand store on the web or from Firestore in the API.
 */

import type { ValidationIssue } from '@genshin/validation';
import { issue, prefixPaths } from '@genshin/validation';

import type { CollectionTeamMembers, TeamSlot } from './collection-team.js';
import { validateArtifactPlan } from '../artifact/artifact-plan-validation.js';

/**
 * Caller-supplied ownership data for collection-aware validation.
 *
 * On the web, populate from zustand / TanStack Query state.
 * On the API, populate from Firestore lookups before calling validators.
 */
export interface TeamValidationContext {
  /** Character IDs the user owns. */
  ownedCharacterIds: ReadonlySet<string>;
  /** Weapon instance IDs the user owns. */
  ownedWeaponInstanceIds: ReadonlySet<string>;
}

// ---------------------------------------------------------------------------
// validateTeam
// ---------------------------------------------------------------------------

/**
 * Checks one team in isolation: no character or weapon instance appears twice
 * in it, and every member's artifact plan holds up.
 *
 * Sees only the team handed to it, so a weapon another team already equips
 * passes here. `validateTeams` is the check that catches that.
 *
 * @param context - what the user owns. Omitting it skips the ownership checks,
 * which is how the web validates before it knows the collection.
 * @returns every issue found, empty when the team is valid.
 */
export function validateTeam(
  team: { name: string; members: CollectionTeamMembers; description?: string },
  context?: TeamValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Per-team uniqueness: no duplicate character IDs --------------------
  const seen = new Set<string>();
  for (const [i, member] of team.members.entries()) {
    if (member === null) continue;
    if (seen.has(member.characterId)) {
      issues.push(
        issue(`Duplicate character ID: ${member.characterId}`, `members[${i}].characterId`),
      );
    }
    seen.add(member.characterId);
  }

  // Ownership checks (when collection context is available) ------------
  if (context) {
    for (const [i, member] of team.members.entries()) {
      if (member === null) continue;
      if (!context.ownedCharacterIds.has(member.characterId)) {
        issues.push(
          issue(`Character not in collection: ${member.characterId}`, `members[${i}].characterId`),
        );
      }
      if (member.weaponInstanceId && !context.ownedWeaponInstanceIds.has(member.weaponInstanceId)) {
        issues.push(
          issue(
            `Weapon instance not in collection: ${member.weaponInstanceId}`,
            `members[${i}].weaponInstanceId`,
          ),
        );
      }
    }
  }

  // Per-team weapon uniqueness: no duplicate weapon instance IDs ------
  const seenWeapons = new Set<string>();
  for (const [i, member] of team.members.entries()) {
    if (member === null) continue;
    if (member.weaponInstanceId) {
      if (seenWeapons.has(member.weaponInstanceId)) {
        issues.push(
          issue(
            `Duplicate weapon instance ID: ${member.weaponInstanceId}`,
            `members[${i}].weaponInstanceId`,
          ),
        );
      }
      seenWeapons.add(member.weaponInstanceId);
    }
  }

  // Per-member artifact plan validation --------------------------------
  for (const [i, member] of team.members.entries()) {
    if (member === null) continue;
    if (member.artifactPlan) {
      issues.push(
        ...prefixPaths(validateArtifactPlan(member.artifactPlan), `members[${i}].artifactPlan`),
      );
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// validateTeams
// ---------------------------------------------------------------------------

/**
 * Checks one team against the user's others, which `validateTeam` can't see.
 *
 * A weapon instance is a single physical item, so only one character may hold
 * it. The game allows the same character to carry it across several teams,
 * though, so the conflict is between two different characters rather than
 * between two teams.
 *
 * @param slot - the team being saved, skipped when scanning the others so its
 * own stored version doesn't conflict with itself.
 * @param allTeams - the user's persisted teams, which may include `slot`.
 * @returns every issue found, empty when nothing conflicts.
 */
export function validateTeams(
  slot: TeamSlot,
  currentMembers: CollectionTeamMembers,
  allTeams: { slot: TeamSlot; members: CollectionTeamMembers }[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Build a map of weaponInstanceId → characterId from other teams.
  const equippedWeapons = new Map<string, string>();
  for (const team of allTeams) {
    if (team.slot === slot) continue;
    for (const member of team.members) {
      if (member?.weaponInstanceId) {
        equippedWeapons.set(member.weaponInstanceId, member.characterId);
      }
    }
  }

  for (const [i, member] of currentMembers.entries()) {
    if (!member?.weaponInstanceId) continue;

    const existingOwner = equippedWeapons.get(member.weaponInstanceId);
    if (existingOwner && existingOwner !== member.characterId) {
      issues.push(
        issue(
          `Weapon instance ${member.weaponInstanceId} is already equipped by character ${existingOwner}`,
          `members[${i}].weaponInstanceId`,
        ),
      );
    }
  }

  return issues;
}
