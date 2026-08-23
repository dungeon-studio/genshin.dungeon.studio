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

import { hasSecondarySetWithoutPrimary } from './artifact-plan.js';

// Intentionally uses loose string types instead of ArtifactPlan's branded types
// (SandsMainAffix, etc.). The validator's job is to check raw input *before* it
// becomes a domain object. Accepting ArtifactPlan would make the call circular.
// Once #590 lands, JSON Schema enum constraints handle this at the boundary and
// this function shrinks to just the disjointness check.
export function validateArtifactPlan(plan: {
  sands?: string;
  goblet?: string;
  circlet?: string;
  primarySetId?: string;
  secondarySetId?: string;
  priorityMinorAffixes?: string[];
  secondaryMinorAffixes?: string[];
}): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Main affixes -------------------------------------------------------
  if (plan.sands !== undefined && !(SANDS_MAIN_AFFIXES as readonly string[]).includes(plan.sands)) {
    issues.push(issue(`Invalid sands main affix: ${plan.sands}`, 'sands'));
  }

  if (
    plan.goblet !== undefined &&
    !(GOBLET_MAIN_AFFIXES as readonly string[]).includes(plan.goblet)
  ) {
    issues.push(issue(`Invalid goblet main affix: ${plan.goblet}`, 'goblet'));
  }

  if (
    plan.circlet !== undefined &&
    !(CIRCLET_MAIN_AFFIXES as readonly string[]).includes(plan.circlet)
  ) {
    issues.push(issue(`Invalid circlet main affix: ${plan.circlet}`, 'circlet'));
  }

  // Sets ---------------------------------------------------------------
  if (plan.primarySetId !== undefined && !getArtifactSetById(plan.primarySetId)) {
    issues.push(issue(`Unknown artifact set: ${plan.primarySetId}`, 'primarySetId'));
  }

  if (hasSecondarySetWithoutPrimary(plan)) {
    issues.push(issue('A secondary artifact set requires a primary set', 'secondarySetId'));
  }

  if (plan.secondarySetId !== undefined && !getArtifactSetById(plan.secondarySetId)) {
    issues.push(issue(`Unknown artifact set: ${plan.secondarySetId}`, 'secondarySetId'));
  }

  // Minor affixes ------------------------------------------------------
  for (const field of ['priorityMinorAffixes', 'secondaryMinorAffixes'] as const) {
    const arr = plan[field];
    if (arr === undefined) continue;

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
  if (plan.priorityMinorAffixes && plan.secondaryMinorAffixes) {
    const prioritySet = new Set(plan.priorityMinorAffixes);
    const overlap = plan.secondaryMinorAffixes.filter((s) => prioritySet.has(s));
    if (overlap.length > 0) {
      issues.push(
        issue(
          `Priority and secondary minor affixes must be disjoint. Overlap: ${overlap.join(', ')}`,
          'secondaryMinorAffixes',
        ),
      );
    }
  }

  return issues;
}
