/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * Team composition validators for issue #52.
 *
 * These return {@link ValidationIssue}[] instead of throwing, so callers
 * can display all issues at once (inline messages).
 *
 * Pure functions — no I/O. Ownership checks require a
 * {@link TeamValidationContext} built by the caller from either the
 * local zustand store (web) or Firestore queries (API).
 */

import type { ValidationIssue } from '@genshin/validation';
import { issue, prefixPaths } from '@genshin/validation';
import { validateArtifactPlan } from './artifactPlanValidation.js';
import type { TeamSlot } from './team.js';
import type { TeamMember } from './teamMember.js';

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
// validateTeamSlot
// ---------------------------------------------------------------------------

export function validateTeamSlot(slot: unknown): ValidationIssue[] {
  if (typeof slot !== 'number' || !Number.isInteger(slot) || slot < 1 || slot > 4) {
    return [issue('Team slot must be an integer between 1 and 4', 'slot')];
  }

  return [];
}

// ---------------------------------------------------------------------------
// validateTeam
// ---------------------------------------------------------------------------

/**
 * Validate a team composition against game rules and optional ownership data.
 *
 * When `context` is omitted, ownership checks are skipped (useful for
 * offline / anonymous validation on the web).
 */
export function validateTeam(
  team: { name: string; members: (TeamMember | null)[]; description?: string },
  context?: TeamValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Member count: 0-4 allowed (incomplete teams filled in later) -------
  if (team.members.length > 4) {
    issues.push(issue(`Team must have at most 4 members, got ${team.members.length}`, 'members'));
  }

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
 * Validate cross-team invariants for the team being saved.
 *
 * Currently checks weapon uniqueness: a weapon instance can only be equipped
 * by one character at a time across all teams. The same character carrying
 * the same weapon on multiple teams is allowed (Genshin Impact semantics).
 *
 * @param slot - The team slot being saved.
 * @param currentMembers - Members of the team being saved.
 * @param allTeams - All persisted teams for the user (may include the team being saved).
 */
export function validateTeams(
  slot: TeamSlot,
  currentMembers: (TeamMember | null)[],
  allTeams: { slot: TeamSlot; members: (TeamMember | null)[] }[],
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Build a map of weaponInstanceId → characterId from other teams.
  const equippedWeapons = new Map<string, string>();
  for (const team of allTeams) {
    if (team.slot === slot) continue;
    for (const member of team.members) {
      if (member !== null && member.weaponInstanceId) {
        equippedWeapons.set(member.weaponInstanceId, member.characterId);
      }
    }
  }

  for (const [i, member] of currentMembers.entries()) {
    if (member === null || !member.weaponInstanceId) continue;

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
