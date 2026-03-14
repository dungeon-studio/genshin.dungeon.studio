/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';
import type { TeamSlot } from './team.js';
import type { TeamMember } from './teamMember.js';

export const MIN_TEAM_SLOT = 1;
export const MAX_TEAM_SLOT = 4;

/**
 * CollectionTeam is the persisted form of a user's team composition.
 *
 * Each user has up to 4 team loadout slots (1–4). Members is an empty
 * array for cleared teams and a 4-element array of TeamMember for
 * populated teams.
 */
export interface CollectionTeam {
  slot: TeamSlot;
  name: string;
  members: [TeamMember, TeamMember, TeamMember, TeamMember] | [];
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
