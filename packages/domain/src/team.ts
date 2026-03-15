/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ISOTimestamp } from './isoTimestamp.js';
import type { TeamMember } from './teamMember.js';

/**
 * Team loadout slot index for a user (0-indexed, 0-3).
 *
 * This identifies which team loadout in a user's collection this team
 * corresponds to, not the index of an individual party member.
 */
export type TeamSlot = 0 | 1 | 2 | 3;

/**
 * Team represents a party composition of 4 Genshin Impact characters.
 *
 * Each user has exactly 4 team loadout slots, identified by {@link TeamSlot}.
 * Each team in a loadout slot contains exactly 4 party members.
 * Character and weapon data are sourced from @genshin/game-data.
 */
export interface Team {
  /**
   * The user's team loadout slot this team is assigned to (0-3).
   */
  slot: TeamSlot;
  name: string;
  /**
   * The 4 party members (characters plus their configuration) in this team.
   */
  members: [TeamMember, TeamMember, TeamMember, TeamMember];
  description?: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
}
