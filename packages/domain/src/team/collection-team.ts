/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import { assertOptionalString, assertString } from '../assertions.js';
import type { ISOTimestamp } from '../iso-timestamp.js';
import { isISOTimestamp, nowTimestamp } from '../iso-timestamp.js';
import type { CollectionTeamMember } from './collection-team-member.js';
import {
  assertCollectionTeamMember,
  deserialiseCollectionTeamMember,
} from './collection-team-member.js';

export const MIN_TEAM_SLOT = 1;
export const MAX_TEAM_SLOT = 4;
export const MAX_TEAM_MEMBERS = 4;

/**
 * Team loadout slot index for a user (1-indexed, 1-4).
 *
 * This identifies which team loadout in a user's collection this team
 * corresponds to, not the index of an individual party member.
 */
export type TeamSlot = 1 | 2 | 3 | 4;

/** Every loadout slot in ascending order, for a caller rendering all four. */
export const TEAM_SLOTS: readonly TeamSlot[] = Array.from(
  { length: MAX_TEAM_SLOT - MIN_TEAM_SLOT + 1 },
  (_, i) => (MIN_TEAM_SLOT + i) as TeamSlot,
);

/**
 * Whether an index addresses a position within a team.
 *
 * Positions are 0-indexed, unlike `TeamSlot`, which numbers the loadouts
 * themselves from 1. Both range over four values, so a mix-up type-checks.
 */
export function isValidMemberIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < MAX_TEAM_MEMBERS;
}

/** A fixed-length 4-tuple of team member positions where `null` is an empty position. */
export type CollectionTeamMembers = [
  CollectionTeamMember | null,
  CollectionTeamMember | null,
  CollectionTeamMember | null,
  CollectionTeamMember | null,
];

/**
 * Builds the fixed-length member tuple from untrusted input.
 *
 * Exists because a type derived from a wire schema can't express the fixed
 * length. A shorter or longer array fails rather than being padded, since a
 * missing element would silently shift every position after it.
 *
 * @throws TypeError naming the position that failed.
 */
export function deserialiseCollectionTeamMembers(
  value: unknown,
  path = 'members',
): CollectionTeamMembers {
  if (!Array.isArray(value)) {
    throw new TypeError(`${path} must be an array, got: ${JSON.stringify(value)}`);
  }
  if (value.length !== MAX_TEAM_MEMBERS) {
    throw new TypeError(
      `${path} must have exactly ${MAX_TEAM_MEMBERS} elements, got: ${value.length}`,
    );
  }

  const [first, second, third, fourth] = value.map((member: unknown, index: number) =>
    member === null ? null : deserialiseCollectionTeamMember(member, `${path}[${index}]`),
  );

  return [first, second, third, fourth];
}

/**
 * One of a user's four team loadouts.
 *
 * `slot` is the identity, not a position in a growing list, so storage keys the
 * record by it and a save is an upsert. `members` holds `null` for an empty
 * position rather than omitting it, which is what carries position through a
 * round trip.
 */
export interface CollectionTeam {
  slot: TeamSlot;
  name: string;
  members: CollectionTeamMembers;
  description?: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export function isValidTeamSlot(value: unknown): value is TeamSlot {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= MIN_TEAM_SLOT &&
    value <= MAX_TEAM_SLOT
  );
}

/**
 * Asserts a value read from storage or a request body is a `CollectionTeam`.
 *
 * Shape only. Whether the characters and weapons its members name exist, and
 * whether the user owns them, is `validateTeam`'s job.
 *
 * @throws TypeError naming the field that failed.
 */
export function assertCollectionTeam(value: unknown): asserts value is CollectionTeam {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`CollectionTeam must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const data = value as Record<string, unknown>;
  if (!isValidTeamSlot(data.slot)) {
    throw new TypeError(
      `CollectionTeam.slot must be an integer between ${MIN_TEAM_SLOT} and ${MAX_TEAM_SLOT}, got: ${JSON.stringify(data.slot)}`,
    );
  }
  assertString(data.name, 'CollectionTeam.name');
  if (!Array.isArray(data.members)) {
    throw new TypeError(
      `CollectionTeam.members must be an array, got: ${JSON.stringify(data.members)}`,
    );
  }
  if (data.members.length !== MAX_TEAM_MEMBERS) {
    throw new TypeError(
      `CollectionTeam.members must have exactly ${MAX_TEAM_MEMBERS} entries, got: ${data.members.length}`,
    );
  }
  for (const [i, member] of (data.members as unknown[]).entries()) {
    if (member === null) continue;
    assertCollectionTeamMember(member, `CollectionTeam.members[${i}]`);
  }
  assertOptionalString(data.description, 'CollectionTeam.description');
  if (!isISOTimestamp(data.createdAt)) {
    throw new TypeError(
      `CollectionTeam.createdAt must be an ISO 8601 timestamp, got: ${JSON.stringify(data.createdAt)}`,
    );
  }
  if (!isISOTimestamp(data.updatedAt)) {
    throw new TypeError(
      `CollectionTeam.updatedAt must be an ISO 8601 timestamp, got: ${JSON.stringify(data.updatedAt)}`,
    );
  }
}

/** The name a team slot shows before the user gives it a custom one. */
export function defaultTeamName(slot: TeamSlot): string {
  return `Team ${slot}`;
}

/**
 * An unsaved team with every position empty and the default name.
 *
 * Stamps both timestamps with the current instant, so a team that has never
 * been saved still satisfies `CollectionTeam` and reads as freshly created.
 */
export function createEmptyTeam(slot: TeamSlot): CollectionTeam {
  const now = nowTimestamp();
  return {
    slot,
    name: defaultTeamName(slot),
    members: [null, null, null, null],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * All four slots filled with empty teams, keyed by slot.
 *
 * The baseline a client overlays saved teams onto. Storage holds a record only
 * for a slot the user has saved, so a client that rendered the stored list
 * directly would show fewer than four.
 */
export function initialTeams(): Record<TeamSlot, CollectionTeam> {
  return Object.fromEntries(TEAM_SLOTS.map((slot) => [slot, createEmptyTeam(slot)])) as Record<
    TeamSlot,
    CollectionTeam
  >;
}
