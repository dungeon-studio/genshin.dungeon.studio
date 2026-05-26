/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { Character } from '@genshin/game-data';

import type { ArtifactPlan } from './artifact-plan.js';
import type { UUID } from './uuid.js';

/**
 * CollectionTeamMember represents a single character position in a team with
 * equipped weapon and artifacts.
 *
 * Character details should be looked up from @genshin/game-data using characterId.
 * The weaponInstanceId references a specific weapon instance in the user's collection.
 */
export interface CollectionTeamMember {
  characterId: Character['id'];
  weaponInstanceId?: UUID;
  artifactPlan?: ArtifactPlan;
}
