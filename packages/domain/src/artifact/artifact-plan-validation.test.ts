// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { validateArtifactPlan } from './artifact-plan-validation.js';

describe('validateArtifactPlan', () => {
  it('returns no issues for an empty plan', () => {
    expect(validateArtifactPlan({})).toEqual([]);
  });

  it('returns no issues for disjoint minor affix lists', () => {
    const issues = validateArtifactPlan({
      priorityMinorAffixes: ['CRIT Rate', 'CRIT DMG'],
      secondaryMinorAffixes: ['ATK Percentage'],
    });
    expect(issues).toEqual([]);
  });

  it('rejects overlapping priority and secondary minor affixes', () => {
    const issues = validateArtifactPlan({
      priorityMinorAffixes: ['CRIT Rate', 'CRIT DMG'],
      secondaryMinorAffixes: ['CRIT Rate', 'ATK Percentage'],
    });
    expect(issues).toEqual([
      {
        message: 'Priority and secondary minor affixes must be disjoint. Overlap: CRIT Rate',
        path: 'secondaryMinorAffixes',
      },
    ]);
  });
});
