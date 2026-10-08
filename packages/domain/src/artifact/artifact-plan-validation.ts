/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * The value half of artifact plan checking, paired with `assertArtifactPlan`'s
 * structural half.
 *
 * Collects issues rather than throwing on the first, because the caller is a
 * form that shows every field's message at once.
 */

import {
  ARTIFACT_MINOR_AFFIXES,
  CIRCLET_MAIN_AFFIXES,
  getArtifactSetById,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
} from '@genshin/game-data';
import type { ValidationIssue } from '@genshin/validation';
import { issue } from '@genshin/validation';

/**
 * Checks a plan against game data and the rules its type can't express. Takes
 * plain strings because it checks raw input before it becomes an
 * `ArtifactPlan`.
 */
export function validateArtifactPlan(plan: {
  sands?: string;
  goblet?: string;
  circlet?: string;
  sets?: string[];
  priorityMinorAffixes?: string[];
  secondaryMinorAffixes?: string[];
}): ValidationIssue[] {
  return [
    ...validateMainAffix('sands', plan.sands, SANDS_MAIN_AFFIXES),
    ...validateMainAffix('goblet', plan.goblet, GOBLET_MAIN_AFFIXES),
    ...validateMainAffix('circlet', plan.circlet, CIRCLET_MAIN_AFFIXES),
    ...validateSets(plan.sets),
    ...validateMinorAffixes('priorityMinorAffixes', plan.priorityMinorAffixes),
    ...validateMinorAffixes('secondaryMinorAffixes', plan.secondaryMinorAffixes),
    ...validateDisjointMinorAffixes(plan.priorityMinorAffixes, plan.secondaryMinorAffixes),
  ];
}

function validateMainAffix(
  slot: 'sands' | 'goblet' | 'circlet',
  affix: string | undefined,
  allowed: readonly string[],
): ValidationIssue[] {
  if (affix === undefined || allowed.includes(affix)) return [];
  return [issue(`Invalid ${slot} main affix: ${affix}`, slot)];
}

function validateSets(sets: string[] | undefined): ValidationIssue[] {
  if (sets === undefined) return [];
  if (sets.length < 1 || sets.length > 2) {
    return [issue('Artifact plan must have 1-2 sets', 'sets')];
  }
  return sets.flatMap((setId, i) =>
    getArtifactSetById(setId) ? [] : [issue(`Unknown artifact set: ${setId}`, `sets[${i}]`)],
  );
}

function validateMinorAffixes(
  field: 'priorityMinorAffixes' | 'secondaryMinorAffixes',
  affixes: string[] | undefined,
): ValidationIssue[] {
  if (affixes === undefined) return [];

  return [
    ...(affixes.length > 3 ? [issue(`${field} must have at most 3 entries`, field)] : []),
    ...affixes.flatMap((affix, i) =>
      (ARTIFACT_MINOR_AFFIXES as readonly string[]).includes(affix)
        ? []
        : [issue(`Invalid minor affix: ${affix}`, `${field}[${i}]`)],
    ),
    ...(new Set(affixes).size !== affixes.length
      ? [issue(`${field} contains duplicates`, field)]
      : []),
  ];
}

function validateDisjointMinorAffixes(
  priority: string[] | undefined,
  secondary: string[] | undefined,
): ValidationIssue[] {
  if (!priority || !secondary) return [];
  const prioritySet = new Set(priority);
  const overlap = secondary.filter((s) => prioritySet.has(s));
  if (overlap.length === 0) return [];
  return [
    issue(
      `Priority and secondary minor affixes must be disjoint. Overlap: ${overlap.join(', ')}`,
      'secondaryMinorAffixes',
    ),
  ];
}
