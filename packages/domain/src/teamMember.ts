/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type {
  ArtifactMinorAffix,
  ArtifactSet,
  Character,
  CircletMainAffix,
  GobletMainAffix,
  SandsMainAffix,
} from '@genshin/game-data';

import type { UUID } from './uuid.js';

/**
 * Artifact plan configuration for a team member.
 *
 * Describes the desired artifact main affix restrictions, set bonuses, and sub-affix priorities.
 * Artifact sets reference IDs from @genshin/game-data.
 */
export interface ArtifactPlan {
  /** Desired main affix for Sands of Eon */
  sands: SandsMainAffix;
  /** Desired main affix for Goblet of Eonothem */
  goblet: GobletMainAffix;
  /** Desired main affix for Circlet of Logos */
  circlet: CircletMainAffix;
  /** 1–2 artifact set IDs from game-data */
  sets: [ArtifactSet['id']] | [ArtifactSet['id'], ArtifactSet['id']];
  /** 0–3 priority minor affixes to prioritize */
  priorityMinorAffixes: ArtifactMinorAffix[];
  /** 0–3 secondary minor affixes (must be disjoint from priorityMinorAffixes) */
  secondaryMinorAffixes: ArtifactMinorAffix[];
}

/**
 * TeamMember represents a single character slot in a team with equipped weapon and artifacts.
 *
 * Character details should be looked up from @genshin/game-data using characterId.
 * The weaponInstanceId references a specific weapon instance in the user's collection.
 */
export interface TeamMember {
  characterId: Character['id'];
  weaponInstanceId?: UUID;
  artifactPlan?: ArtifactPlan;
}
