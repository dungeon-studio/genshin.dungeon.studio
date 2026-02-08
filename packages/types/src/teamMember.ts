/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';
import type { Weapon } from '@genshin/game-data';

/**
 * Placeholder for artifact plan configuration.
 * TODO: Define full artifact plan structure (set pieces, main/sub stats)
 */
export type ArtifactPlan = Record<string, unknown>;

/**
 * TeamMember represents a single character slot in a team with equipped weapon and artifacts.
 *
 * Character and weapon details should be looked up from @genshin/game-data
 * using the characterId and weaponId. The specific artifact plan configuration
 * (set pieces, main/sub stats) is stored separately.
 */
export interface TeamMember {
  characterId: Character['id'];
  weaponId: Weapon['id'];
  artifactPlan?: ArtifactPlan;
}
