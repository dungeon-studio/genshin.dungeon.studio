// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { isValid } from '@genshin/validation';
import { describe, expect, it } from 'vitest';

import { validateArtifactPlan } from './artifact-plan-validation.js';

describe('validateArtifactPlan', () => {
  it('returns no issues for an empty plan', () => {
    expect(validateArtifactPlan({})).toEqual([]);
  });

  it('returns no issues for a fully valid plan', () => {
    const issues = validateArtifactPlan({
      sands: 'ATK Percentage',
      goblet: 'Pyro DMG Bonus',
      circlet: 'CRIT Rate',
      primarySetId: 'aubade-of-morningstar-and-moon',
      secondarySetId: 'a-day-carved-from-rising-winds',
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

  it('rejects an unknown primary artifact set ID', () => {
    const issues = validateArtifactPlan({ primarySetId: 'nonexistent-set' });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'primarySetId')).toBe(true);
  });

  it('rejects an unknown secondary artifact set ID', () => {
    const issues = validateArtifactPlan({
      primarySetId: 'aubade-of-morningstar-and-moon',
      secondarySetId: 'nonexistent-set',
    });
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.path === 'secondarySetId')).toBe(true);
  });

  it('rejects a secondary artifact set without a primary set', () => {
    const issues = validateArtifactPlan({ secondarySetId: 'aubade-of-morningstar-and-moon' });
    expect(issues.some((i) => i.path === 'secondarySetId')).toBe(true);
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
