/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * The cross-field half of artifact plan checking. Affix names, set IDs, list
 * lengths, and duplicates within a list are JSON Schema keywords, so the API's
 * request schema enforces them; what stays here relates one field to another.
 *
 * Collects issues rather than throwing on the first, because the caller is a
 * form that shows every field's message at once.
 */

import type { ValidationIssue } from '@genshin/validation';
import { issue } from '@genshin/validation';

import type { ArtifactPlan } from './artifact-plan.js';

/**
 * Checks that no minor affix appears in both the priority and secondary lists.
 *
 * @returns every issue found, empty when the plan is valid.
 */
export function validateArtifactPlan(plan: ArtifactPlan): ValidationIssue[] {
  const { priorityMinorAffixes: priority, secondaryMinorAffixes: secondary } = plan;
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
