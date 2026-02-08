/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * TeamMember represents a single character slot in a team with equipped weapon and artifacts.
 *
 * Character and weapon details should be looked up from @genshin/game-data
 * using the characterId and weaponId. The specific artifact plan configuration
 * (set pieces, main/sub stats) is stored separately.
 */
export interface TeamMember {
  characterId: string;
  weaponId: string;
  artifactPlan?: unknown; // TODO: Define artifact plan structure
}
