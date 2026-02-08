/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * TeamMember represents a single character slot in a team with equipped weapon and artifacts
 * Character and weapon data are sourced from @genshin/game-data
 */
export interface TeamMember {
  characterId: string;
  weaponId: string;
  artifactPlan?: unknown; // TODO: Define artifact plan structure
}
