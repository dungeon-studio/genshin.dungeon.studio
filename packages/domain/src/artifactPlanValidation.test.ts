// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { isValid } from '@genshin/validation';

import { validateArtifactPlan } from './artifactPlanValidation.js';

describe('validateArtifactPlan', () => {
  it('returns no issues for an empty plan', () => {
    expect(validateArtifactPlan({})).toEqual([]);
  });

  it('returns no issues for a fully valid plan', () => {
    const issues = validateArtifactPlan({
      sands: 'ATK Percentage',
      goblet: 'Pyro DMG Bonus',
      circlet: 'CRIT Rate',
      sets: ['aubade-of-morningstar-and-moon'],
      priorityMinorAffixes: ['CRIT Rate', 'CRIT DMG'],
      secondaryMinorAffixes: ['ATK Percentage'],
    });
    expect(isValid(issues)).toBe(true);
  });

  it('rejects an invalid sands main affix', () => {
    const issues = validateArtifactPlan({ sands: 'INVALID' });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'sands')).toBe(true);
  });

  it('rejects an invalid goblet main affix', () => {
    const issues = validateArtifactPlan({ goblet: 'INVALID' });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'goblet')).toBe(true);
  });

  it('rejects an invalid circlet main affix', () => {
    const issues = validateArtifactPlan({ circlet: 'INVALID' });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'circlet')).toBe(true);
  });

  it('rejects zero sets', () => {
    const issues = validateArtifactPlan({ sets: [] });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'sets')).toBe(true);
  });

  it('rejects more than 2 sets', () => {
    const issues = validateArtifactPlan({
      sets: [
        'aubade-of-morningstar-and-moon',
        'a-day-carved-from-rising-winds',
        'silken-moons-serenade',
      ],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'sets')).toBe(true);
  });

  it('rejects an unknown artifact set ID', () => {
    const issues = validateArtifactPlan({ sets: ['nonexistent-set'] });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'sets[0]')).toBe(true);
  });

  it('rejects more than 3 priority minor affixes', () => {
    const issues = validateArtifactPlan({
      priorityMinorAffixes: ['HP', 'ATK', 'DEF', 'HP Percentage'],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'priorityMinorAffixes')).toBe(true);
  });

  it('rejects an invalid minor affix', () => {
    const issues = validateArtifactPlan({
      priorityMinorAffixes: ['INVALID_AFFIX'],
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'priorityMinorAffixes[0]')).toBe(true);
  });

  it('rejects duplicate minor affixes', () => {
    const issues = validateArtifactPlan({
      priorityMinorAffixes: ['HP', 'HP'],
    });
    expect(issues.some((i) => i.message.match(/duplicates/i))).toBe(true);
  });

  it('rejects overlapping priority and secondary minor affixes', () => {
    const issues = validateArtifactPlan({
      priorityMinorAffixes: ['CRIT Rate'],
      secondaryMinorAffixes: ['CRIT Rate'],
    });
    expect(issues.some((i) => i.message.match(/disjoint/i))).toBe(true);
  });
});
