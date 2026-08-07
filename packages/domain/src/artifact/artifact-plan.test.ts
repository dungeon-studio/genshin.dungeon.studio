// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { assertArtifactPlan } from './artifact-plan.js';

const VALID_PLAN = {
  sands: 'ATK Percentage',
  goblet: 'Hydro DMG Bonus',
  circlet: 'CRIT Rate',
  sets: ['aubade-of-morningstar-and-moon'],
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

  it.each(['sands', 'goblet', 'circlet', 'sets', 'priorityMinorAffixes', 'secondaryMinorAffixes'])(
    'accepts a plan omitting %s',
    (field) => {
      const { [field]: _omitted, ...rest } = VALID_PLAN as Record<string, unknown>;
      expect(() => assertArtifactPlan(rest)).not.toThrow();
    },
  );

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

  it('throws for sets that is not an array', () => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN, sets: 'one-set' })).toThrow(
      /artifactPlan\.sets must be an array/,
    );
  });

  it('throws for a non-string set entry', () => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN, sets: [42] })).toThrow(
      /artifactPlan\.sets\[0\] must be a string/,
    );
  });

  it('throws for an empty sets array', () => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN, sets: [] })).toThrow(
      /artifactPlan\.sets must have between 1 and 2/,
    );
  });

  it('throws for more than two sets', () => {
    expect(() => assertArtifactPlan({ ...VALID_PLAN, sets: ['a', 'b', 'c'] })).toThrow(
      /artifactPlan\.sets must have between 1 and 2/,
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
