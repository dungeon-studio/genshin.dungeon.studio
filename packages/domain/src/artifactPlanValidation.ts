/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * Artifact plan validators.
 *
 * Returns {@link ValidationIssue}[] instead of throwing, so callers
 * can display all issues at once (inline messages).
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

export function validateArtifactPlan(plan: {
  sands: string;
  goblet: string;
  circlet: string;
  sets: string[];
  priorityMinorAffixes: string[];
  secondaryMinorAffixes: string[];
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Main affixes -------------------------------------------------------
  if (!(SANDS_MAIN_AFFIXES as readonly string[]).includes(plan.sands)) {
    issues.push(issue(`Invalid sands main affix: ${plan.sands}`, 'sands'));
  }

  if (!(GOBLET_MAIN_AFFIXES as readonly string[]).includes(plan.goblet)) {
    issues.push(issue(`Invalid goblet main affix: ${plan.goblet}`, 'goblet'));
  }

  if (!(CIRCLET_MAIN_AFFIXES as readonly string[]).includes(plan.circlet)) {
    issues.push(issue(`Invalid circlet main affix: ${plan.circlet}`, 'circlet'));
  }

  // Sets ---------------------------------------------------------------
  if (plan.sets.length < 1 || plan.sets.length > 2) {
    issues.push(issue('Artifact plan must have 1-2 sets', 'sets'));
  } else {
    for (const [i, setId] of plan.sets.entries()) {
      if (!getArtifactSetById(setId)) {
        issues.push(issue(`Unknown artifact set: ${setId}`, `sets[${i}]`));
      }
    }
  }

  // Minor affixes ------------------------------------------------------
  for (const field of ['priorityMinorAffixes', 'secondaryMinorAffixes'] as const) {
    const arr = plan[field];

    if (arr.length > 3) {
      issues.push(issue(`${field} must have at most 3 entries`, field));
    }

    for (const [i, affix] of arr.entries()) {
      if (!(ARTIFACT_MINOR_AFFIXES as readonly string[]).includes(affix)) {
        issues.push(issue(`Invalid minor affix: ${affix}`, `${field}[${i}]`));
      }
    }

    if (new Set(arr).size !== arr.length) {
      issues.push(issue(`${field} contains duplicates`, field));
    }
  }

  // Disjointness -------------------------------------------------------
  const prioritySet = new Set(plan.priorityMinorAffixes);
  const overlap = plan.secondaryMinorAffixes.filter((s) => prioritySet.has(s));
  if (overlap.length > 0) {
    issues.push(
      issue(
        `Priority and secondary minor affixes must be disjoint. Overlap: ${overlap.join(', ')}`,
      ),
    );
  }

  return issues;
}
