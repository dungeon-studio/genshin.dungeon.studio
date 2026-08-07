/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type {
  ArtifactMinorAffix,
  ArtifactSet,
  CircletMainAffix,
  GobletMainAffix,
  SandsMainAffix,
} from '@genshin/game-data';

import { assertOptionalString, assertOptionalStringArray } from '../assertions.js';

/**
 * Artifact plan configuration for a team member.
 *
 * All fields are optional to support incremental planning. Users can fill in
 * whichever aspects they know (e.g. main stats only) and leave the rest for
 * later refinement or AI-assisted optimisation.
 *
 * Artifact sets reference IDs from @genshin/game-data.
 */
export interface ArtifactPlan {
  /** Desired main affix for Sands of Eon */
  sands?: SandsMainAffix;
  /** Desired main affix for Goblet of Eonothem */
  goblet?: GobletMainAffix;
  /** Desired main affix for Circlet of Logos */
  circlet?: CircletMainAffix;
  /** 1–2 artifact set IDs from game-data */
  sets?: [ArtifactSet['id']] | [ArtifactSet['id'], ArtifactSet['id']];
  /** 0–3 priority minor affixes to prioritize */
  priorityMinorAffixes?: ArtifactMinorAffix[];
  /** 0–3 secondary minor affixes (must be disjoint from priorityMinorAffixes) */
  secondaryMinorAffixes?: ArtifactMinorAffix[];
}

const MIN_SETS = 1;
const MAX_SETS = 2;
const MIN_MINOR_AFFIXES = 0;
const MAX_MINOR_AFFIXES = 3;

/**
 * Assert that `value` has the shape of an {@link ArtifactPlan}.
 *
 * Checks structure only — affix names and set IDs are checked against
 * game-data by {@link validateArtifactPlan}, which reports every problem at
 * once instead of throwing on the first.
 *
 * @param path - Prefix for error messages, so a nested plan reports its
 *   position (e.g. `CollectionTeam.members[0].artifactPlan`).
 */
export function assertArtifactPlan(
  value: unknown,
  path = 'artifactPlan',
): asserts value is ArtifactPlan {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`${path} must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const plan = value as Record<string, unknown>;
  assertOptionalString(plan.sands, `${path}.sands`);
  assertOptionalString(plan.goblet, `${path}.goblet`);
  assertOptionalString(plan.circlet, `${path}.circlet`);
  assertOptionalStringArray(plan.sets, `${path}.sets`, MIN_SETS, MAX_SETS);
  assertOptionalStringArray(
    plan.priorityMinorAffixes,
    `${path}.priorityMinorAffixes`,
    MIN_MINOR_AFFIXES,
    MAX_MINOR_AFFIXES,
  );
  assertOptionalStringArray(
    plan.secondaryMinorAffixes,
    `${path}.secondaryMinorAffixes`,
    MIN_MINOR_AFFIXES,
    MAX_MINOR_AFFIXES,
  );
}
