/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { TeamMember } from './teamMember';

/**
 * Slot number for team slots (0-indexed, 0-3)
 */
export type TeamSlot = 0 | 1 | 2 | 3;

/**
 * Team represents a party composition of 4 Genshin Impact characters
 * Each user has exactly 4 team slots
 * Character and weapon data are sourced from @genshin/game-data
 */
export interface Team {
  slot: TeamSlot;
  name: string;
  members: [TeamMember, TeamMember, TeamMember, TeamMember];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
