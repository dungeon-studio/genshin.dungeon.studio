/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';
import { isISOTimestamp } from './isoTimestamp.js';
import type { TeamSlot } from './team.js';
import { MAX_TEAM_MEMBERS, MAX_TEAM_SLOT, MIN_TEAM_SLOT } from './team.js';
import type { TeamMember } from './teamMember.js';

/**
 * CollectionTeam is the persisted form of a user's team composition.
 *
 * Each user has up to 4 team loadout slots (1–4). Members is an array with
 * 0 to 4 entries where `null` represents an empty slot, preserving positional
 * information across API round-trips.
 */
export interface CollectionTeam {
  slot: TeamSlot;
  name: string;
  members: (TeamMember | null)[];
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
  if (data.members.length > MAX_TEAM_MEMBERS) {
    throw new TypeError(
      `CollectionTeam.members must have at most ${MAX_TEAM_MEMBERS} entries, got: ${data.members.length}`,
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
