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
import {
  ARTIFACT_MINOR_AFFIXES,
  CIRCLET_MAIN_AFFIXES,
  getArtifactSetById,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
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

export function assertArtifactPlan(value: unknown): asserts value is ArtifactPlan {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`ArtifactPlan must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const plan = value as Record<string, unknown>;

  for (const field of ['sands', 'goblet', 'circlet'] as const) {
    if (typeof plan[field] !== 'string') {
      throw new TypeError(
        `ArtifactPlan.${field} must be a string, got: ${JSON.stringify(plan[field])}`,
      );
    }
  }

  const mainAffixMap = {
    sands: SANDS_MAIN_AFFIXES as readonly string[],
    goblet: GOBLET_MAIN_AFFIXES as readonly string[],
    circlet: CIRCLET_MAIN_AFFIXES as readonly string[],
  } as const;
  for (const [field, valid] of Object.entries(mainAffixMap)) {
    if (!valid.includes(plan[field] as string)) {
      throw new TypeError(
        `ArtifactPlan.${field} is not a valid main affix: ${JSON.stringify(plan[field])}`,
      );
    }
  }

  if (!Array.isArray(plan.sets) || plan.sets.length < 1 || plan.sets.length > 2) {
    throw new TypeError(
      `ArtifactPlan.sets must be an array of 1–2 artifact set IDs, got: ${JSON.stringify(plan.sets)}`,
    );
  }
  for (const setId of plan.sets as string[]) {
    if (!getArtifactSetById(setId)) {
      throw new TypeError(
        `ArtifactPlan.sets contains unknown artifact set: ${JSON.stringify(setId)}`,
      );
    }
  }

  for (const field of ['priorityMinorAffixes', 'secondaryMinorAffixes'] as const) {
    if (!Array.isArray(plan[field])) {
      throw new TypeError(
        `ArtifactPlan.${field} must be an array, got: ${JSON.stringify(plan[field])}`,
      );
    }
    const arr = plan[field] as unknown[];
    if (arr.length > 3) {
      throw new TypeError(`ArtifactPlan.${field} must have at most 3 entries, got ${arr.length}`);
    }
    for (const entry of arr) {
      if (
        typeof entry !== 'string' ||
        !(ARTIFACT_MINOR_AFFIXES as readonly string[]).includes(entry)
      ) {
        throw new TypeError(
          `ArtifactPlan.${field} contains invalid minor affix: ${JSON.stringify(entry)}`,
        );
      }
    }
    if (new Set(arr).size !== arr.length) {
      throw new TypeError(`ArtifactPlan.${field} contains duplicates`);
    }
  }

  const prioritySet = new Set(plan.priorityMinorAffixes as string[]);
  const overlap = (plan.secondaryMinorAffixes as string[]).filter((s) => prioritySet.has(s));
  if (overlap.length > 0) {
    throw new TypeError(
      `ArtifactPlan.priorityMinorAffixes and secondaryMinorAffixes must be disjoint. Overlap: ${overlap.join(', ')}`,
    );
  }
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
