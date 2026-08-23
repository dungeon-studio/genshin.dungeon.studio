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
 * What a team member intends to equip.
 *
 * Every field is optional because planning is incremental: a user who knows the
 * main affixes but not the sets records only those, and later refinement or
 * AI-assisted optimisation fills the rest. An empty plan is therefore valid.
 *
 * The flower and plume carry fixed main affixes, so only the three pieces a
 * user chooses appear here. Set and affix identifiers come from
 * `@genshin/game-data`, and nothing on this type checks them.
 */
export interface ArtifactPlan {
  /** Main affix for the Sands of Eon. */
  sands?: SandsMainAffix;
  /** Main affix for the Goblet of Eonothem. */
  goblet?: GobletMainAffix;
  /** Main affix for the Circlet of Logos. */
  circlet?: CircletMainAffix;
  /** One set worn as a four-piece bonus, or two worn as two-piece bonuses. */
  sets?: [ArtifactSet['id']] | [ArtifactSet['id'], ArtifactSet['id']];
  /** Minor affixes to roll for first, at most three and without duplicates. */
  priorityMinorAffixes?: ArtifactMinorAffix[];
  /** Minor affixes worth keeping after the priorities, disjoint from them. */
  secondaryMinorAffixes?: ArtifactMinorAffix[];
}

const MIN_SETS = 1;
const MAX_SETS = 2;
const MIN_MINOR_AFFIXES = 0;
const MAX_MINOR_AFFIXES = 3;

/**
 * Structural check only. Affix names and set IDs are validated against
 * game-data by `validateArtifactPlan`, which collects every problem instead of
 * throwing on the first.
 *
 * @param path - prefix for the field names in a failure, so a guard over an
 * enclosing structure reports the position that broke.
 * @throws TypeError naming the field that failed.
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

/**
 * Builds an `ArtifactPlan` from untrusted input, keeping only the declared
 * properties.
 *
 * Asserting the shape leaves undeclared properties in place, which would carry
 * a request body's extra fields into storage. Rebuilding the object field by
 * field is what stops them.
 *
 * @throws TypeError naming the field that failed.
 */
export function deserialiseArtifactPlan(value: unknown, path = 'artifactPlan'): ArtifactPlan {
  assertArtifactPlan(value, path);

  return {
    ...(value.sands !== undefined ? { sands: value.sands } : {}),
    ...(value.goblet !== undefined ? { goblet: value.goblet } : {}),
    ...(value.circlet !== undefined ? { circlet: value.circlet } : {}),
    ...(value.sets !== undefined ? { sets: value.sets } : {}),
    ...(value.priorityMinorAffixes !== undefined
      ? { priorityMinorAffixes: value.priorityMinorAffixes }
      : {}),
    ...(value.secondaryMinorAffixes !== undefined
      ? { secondaryMinorAffixes: value.secondaryMinorAffixes }
      : {}),
  };
}
