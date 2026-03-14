/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type { ArtifactSet, Character } from '@genshin/game-data';

import type { UUID } from './uuid.js';

/**
 * Artifact plan configuration for a team member.
 *
 * Describes the desired artifact main stats, set bonuses, and stat priorities.
 * Artifact sets reference IDs from @genshin/game-data.
 */
export interface ArtifactPlan {
  /** Desired main stat for Sands of Eon (e.g., "ATK%") */
  sands: string;
  /** Desired main stat for Goblet of Eonothem (e.g., "Pyro DMG") */
  goblet: string;
  /** Desired main stat for Circlet of Logos (e.g., "Crit DMG") */
  circlet: string;
  /** 1–2 artifact set IDs from game-data */
  sets: [ArtifactSet['id']] | [ArtifactSet['id'], ArtifactSet['id']];
  /** 1–3 desired primary stats to prioritize */
  primaryStats: string[];
  /** 0–3 desired secondary stats (must be disjoint from primaryStats) */
  secondaryStats: string[];
}

/**
 * TeamMember represents a single character slot in a team with equipped weapon and artifacts.
 *
 * Character details should be looked up from @genshin/game-data using characterId.
 * The weaponInstanceId references a specific weapon instance in the user's collection.
 */
export interface TeamMember {
  characterId: Character['id'];
  weaponInstanceId: UUID;
  artifactPlan?: ArtifactPlan;
}
