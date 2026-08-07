/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import type {
  ArtifactMinorAffix,
  ArtifactSet,
  CircletMainAffix,
  GobletMainAffix,
  SandsMainAffix,
} from '@genshin/game-data';

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

function assertOptionalString(plan: Record<string, unknown>, path: string, field: string): void {
  if (plan[field] !== undefined && typeof plan[field] !== 'string') {
    throw new TypeError(`${path}.${field} must be a string, got: ${JSON.stringify(plan[field])}`);
  }
}

function assertOptionalStringArray(
  plan: Record<string, unknown>,
  path: string,
  field: string,
  min: number,
  max: number,
): void {
  const arr = plan[field];
  if (arr === undefined) return;
  if (!Array.isArray(arr)) {
    throw new TypeError(`${path}.${field} must be an array, got: ${JSON.stringify(arr)}`);
  }
  if (arr.length < min || arr.length > max) {
    throw new TypeError(
      `${path}.${field} must have between ${min} and ${max} elements, got: ${arr.length}`,
    );
  }
  arr.forEach((element, index) => {
    if (typeof element !== 'string') {
      throw new TypeError(
        `${path}.${field}[${index}] must be a string, got: ${JSON.stringify(element)}`,
      );
    }
  });
}

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
  assertOptionalString(plan, path, 'sands');
  assertOptionalString(plan, path, 'goblet');
  assertOptionalString(plan, path, 'circlet');
  assertOptionalStringArray(plan, path, 'sets', 1, 2);
  assertOptionalStringArray(plan, path, 'priorityMinorAffixes', 0, 3);
  assertOptionalStringArray(plan, path, 'secondaryMinorAffixes', 0, 3);
}
