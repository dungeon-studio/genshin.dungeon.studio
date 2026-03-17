/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';
import { isISOTimestamp } from './isoTimestamp.js';
import type { TeamSlot } from './team.js';
import type { TeamMember } from './teamMember.js';

export const MIN_TEAM_SLOT = 1;
export const MAX_TEAM_SLOT = 4;
export const MAX_TEAM_MEMBERS = 4;

/**
 * CollectionTeam is the persisted form of a user's team composition.
 *
 * Each user has up to 4 team loadout slots (1–4). Members is 0–4 entries;
 * partial teams (with holes) are valid input for downstream optimizers.
 */
export interface CollectionTeam {
  slot: TeamSlot;
  name: string;
  members: TeamMember[];
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
    if (typeof member !== 'object' || member === null || typeof member.characterId !== 'string') {
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
