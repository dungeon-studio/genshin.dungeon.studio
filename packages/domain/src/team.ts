/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';
import { nowTimestamp } from './isoTimestamp.js';
import type { TeamMember } from './teamMember.js';

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

/**
 * Team represents a party composition of up to 4 Genshin Impact characters.
 *
 * Each user has exactly 4 team loadout slots, identified by {@link TeamSlot}.
 * Each slot in the members tuple can be `undefined` when no character is
 * assigned yet (incomplete / in-progress teams).
 * Character and weapon data are sourced from @genshin/game-data.
 */
export interface Team {
  /**
   * The user's team loadout slot this team is assigned to (1-4).
   */
  slot: TeamSlot;
  name: string;
  /**
   * The 4 party member slots. A slot is `undefined` when unoccupied.
   */
  members: [
    TeamMember | undefined,
    TeamMember | undefined,
    TeamMember | undefined,
    TeamMember | undefined,
  ];
  description?: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}

export function isValidMemberIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < MAX_TEAM_MEMBERS;
}

export function createEmptyTeam(slot: TeamSlot): Team {
  const now = nowTimestamp();
  return {
    slot,
    name: `Team ${slot}`,
    members: [undefined, undefined, undefined, undefined],
    createdAt: now,
    updatedAt: now,
  };
}

export function initialTeams(): Record<TeamSlot, Team> {
  return Object.fromEntries(TEAM_SLOTS.map((slot) => [slot, createEmptyTeam(slot)])) as Record<
    TeamSlot,
    Team
  >;
}
