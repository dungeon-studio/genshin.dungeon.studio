// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { assertArtifactPlan } from './artifact-plan.js';

const VALID_PLAN = {
  sands: 'ATK Percentage',
  goblet: 'Hydro DMG Bonus',
  circlet: 'CRIT Rate',
  primarySetId: 'aubade-of-morningstar-and-moon',
  secondarySetId: 'a-day-carved-from-rising-winds',
  priorityMinorAffixes: ['CRIT Rate', 'CRIT DMG'],
  secondaryMinorAffixes: ['ATK Percentage'],
};

describe('assertArtifactPlan', () => {
  it('accepts a fully populated plan', () => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN })).not.toThrow();
  });

  it('accepts an empty plan', () => {
    expect(() => assertArtifactPlan({})).not.toThrow();
  });

  // primarySetId is omitted separately: dropping it alone strands secondarySetId,
  // which is its own rejection case below.
  it.each([
    'sands',
    'goblet',
    'circlet',
    'secondarySetId',
    'priorityMinorAffixes',
    'secondaryMinorAffixes',
  ])('accepts a plan omitting %s', (field) => {
    const { [field]: _omitted, ...rest } = VALID_PLAN as Record<string, unknown>;
    expect(() => assertArtifactPlan(rest)).not.toThrow();
  });

  it('accepts a plan omitting both set IDs', () => {
    const { primarySetId: _p, secondarySetId: _s, ...rest } = VALID_PLAN;
    expect(() => assertArtifactPlan(rest)).not.toThrow();
  });

  it('throws for a non-object', () => {
    expect(() => assertArtifactPlan('not-an-object')).toThrow(
      /artifactPlan must be a non-null object/,
    );
  });

  it('throws for null', () => {
    expect(() => assertArtifactPlan(null)).toThrow(TypeError);
  });

  it.each(['sands', 'goblet', 'circlet'])('throws for a non-string %s', (field) => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN, [field]: 42 })).toThrow(
      new RegExp(`artifactPlan\\.${field} must be a string`),
    );
  });

  it.each(['primarySetId', 'secondarySetId'])('throws for a non-string %s', (field) => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN, [field]: 42 })).toThrow(
      new RegExp(`artifactPlan\\.${field} must be a string`),
    );
  });

  it('throws for a secondary set without a primary set', () => {
    const { primarySetId: _omitted, ...rest } = VALID_PLAN;
    expect(() => assertArtifactPlan(rest)).toThrow(
      /artifactPlan\.secondarySetId requires artifactPlan\.primarySetId/,
    );
  });

  it('throws for more than three minor affixes', () => {
    expect(() =>
      assertArtifactPlan({ ...VALID_PLAN, secondaryMinorAffixes: ['a', 'b', 'c', 'd'] }),
    ).toThrow(/artifactPlan\.secondaryMinorAffixes must have between 0 and 3/);
  });

  it('reports the caller-supplied path', () => {
    expect(() => assertArtifactPlan({ sands: 42 }, 'members[2].artifactPlan')).toThrow(
      /members\[2\]\.artifactPlan\.sands must be a string/,
    );
  });
});
