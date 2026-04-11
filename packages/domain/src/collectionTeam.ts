/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { CollectionTeamMember } from './collectionTeamMember.js';
import type { ISOTimestamp } from './isoTimestamp.js';
import { isISOTimestamp, nowTimestamp } from './isoTimestamp.js';

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

/**
 * All valid team loadout slot values.
 */
export const TEAM_SLOTS: readonly TeamSlot[] = Array.from(
  { length: MAX_TEAM_SLOT - MIN_TEAM_SLOT + 1 },
  (_, i) => (MIN_TEAM_SLOT + i) as TeamSlot,
);

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
 * CollectionTeam is a user's team composition in their collection.
 *
 * Each user has up to 4 team loadout slots (1–4). Members is a fixed-length
 * 4-tuple where `null` represents an empty position, preserving positional
 * information across API round-trips.
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
  if (typeof data.name !== 'string') {
    throw new TypeError(`CollectionTeam.name must be a string, got: ${JSON.stringify(data.name)}`);
  }
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
  for (const member of data.members) {
    if (member === null) continue;
    if (typeof member !== 'object' || typeof member.characterId !== 'string') {
      throw new TypeError(
        `CollectionTeam.members entries must have a string characterId, got: ${JSON.stringify(member)}`,
      );
    }
  }
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

export function createEmptyTeam(slot: TeamSlot): CollectionTeam {
  const now = nowTimestamp();
  return {
    slot,
    name: `Team ${slot}`,
    members: [null, null, null, null],
    createdAt: now,
    updatedAt: now,
  };
}

export function initialTeams(): Record<TeamSlot, CollectionTeam> {
  return Object.fromEntries(TEAM_SLOTS.map((slot) => [slot, createEmptyTeam(slot)])) as Record<
    TeamSlot,
    CollectionTeam
  >;
}
