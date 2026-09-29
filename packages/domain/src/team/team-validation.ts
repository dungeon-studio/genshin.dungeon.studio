/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * The rules a team has to satisfy beyond its shape, which
 * `assertCollectionTeam` covers.
 *
 * Collects issues rather than throwing on the first, because the caller is a
 * form that shows every field's message at once. Nothing here reads storage;
 * ownership checks take a {@link TeamValidationContext} from the caller.
 */

import type { ValidationIssue } from '@genshin/validation';
import { issue, prefixPaths } from '@genshin/validation';

import type { CollectionTeamMembers, TeamSlot } from './collection-team.js';
import { validateArtifactPlan } from '../artifact/artifact-plan-validation.js';

/**
 * What the user owns. The web fills it from zustand and TanStack Query state,
 * the API from Firestore.
 */
export interface TeamValidationContext {
  ownedCharacterIds: ReadonlySet<string>;
  ownedWeaponInstanceIds: ReadonlySet<string>;
}

/**
 * Checks one team without looking at the user's other teams; conflicts between
 * teams are {@link validateAcrossTeams}'s job.
 *
 * @param context - omitting it skips the ownership checks, which is how the web
 * validates before it knows the collection.
 */
export function validateTeam(
  team: { name: string; members: CollectionTeamMembers; description?: string },
  context?: TeamValidationContext,
): ValidationIssue[] {
  return [
    ...validateUnique(team.members, 'characterId', 'character ID'),
    ...(context ? validateOwnership(team.members, context) : []),
    ...validateUnique(team.members, 'weaponInstanceId', 'weapon instance ID'),
    ...validateArtifactPlans(team.members),
  ];
}

/** Flags each member whose `key` repeats an earlier member's. */
function validateUnique(
  members: CollectionTeamMembers,
  key: 'characterId' | 'weaponInstanceId',
  label: string,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  for (const [i, member] of members.entries()) {
    const value = member?.[key];
    if (!value) continue;
    if (seen.has(value)) {
      issues.push(issue(`Duplicate ${label}: ${value}`, `members[${i}].${key}`));
    }
    seen.add(value);
  }
  return issues;
}

function validateOwnership(
  members: CollectionTeamMembers,
  context: TeamValidationContext,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  for (const [i, member] of members.entries()) {
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
  return issues;
}

function validateArtifactPlans(members: CollectionTeamMembers): ValidationIssue[] {
  return [...members.entries()].flatMap(([i, member]) =>
    member?.artifactPlan
      ? prefixPaths(validateArtifactPlan(member.artifactPlan), `members[${i}].artifactPlan`)
      : [],
  );
}

/**
 * Flags each weapon instance in `currentMembers` that a different character
 * holds in another team. The game lets one character carry the same instance
 * in several teams.
 *
 * @param slot - the team being saved. Its stored copy in `allTeams` is skipped.
 */
export function validateAcrossTeams(
  slot: TeamSlot,
  currentMembers: CollectionTeamMembers,
  allTeams: { slot: TeamSlot; members: CollectionTeamMembers }[],
): ValidationIssue[] {
  const holders = weaponHoldersOutside(slot, allTeams);
  return [...currentMembers.entries()].flatMap(([i, member]) => {
    if (!member?.weaponInstanceId) return [];
    const holder = holders.get(member.weaponInstanceId);
    if (!holder || holder === member.characterId) return [];
    return [
      issue(
        `Weapon instance ${member.weaponInstanceId} is already equipped by character ${holder}`,
        `members[${i}].weaponInstanceId`,
      ),
    ];
  });
}

/** Maps each weapon instance equipped outside `slot` to the character holding it. */
function weaponHoldersOutside(
  slot: TeamSlot,
  allTeams: { slot: TeamSlot; members: CollectionTeamMembers }[],
): Map<string, string> {
  return new Map(
    allTeams
      .filter((team) => team.slot !== slot)
      .flatMap((team) => team.members)
      .flatMap((member) =>
        member?.weaponInstanceId ? [[member.weaponInstanceId, member.characterId] as const] : [],
      ),
  );
}
