// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  ARTIFACT_MINOR_AFFIXES,
  CIRCLET_MAIN_AFFIXES,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
} from './artifacts.js';

describe('artifact affix constants', () => {
  it('SANDS_MAIN_AFFIXES has no duplicates', () => {
    expect(new Set(SANDS_MAIN_AFFIXES).size).toBe(SANDS_MAIN_AFFIXES.length);
  });

  it('GOBLET_MAIN_AFFIXES has no duplicates', () => {
    expect(new Set(GOBLET_MAIN_AFFIXES).size).toBe(GOBLET_MAIN_AFFIXES.length);
  });

  it('CIRCLET_MAIN_AFFIXES has no duplicates', () => {
    expect(new Set(CIRCLET_MAIN_AFFIXES).size).toBe(CIRCLET_MAIN_AFFIXES.length);
  });

  it('ARTIFACT_MINOR_AFFIXES has no duplicates', () => {
    expect(new Set(ARTIFACT_MINOR_AFFIXES).size).toBe(ARTIFACT_MINOR_AFFIXES.length);
  });

  it('affix arrays are non-empty', () => {
    expect(SANDS_MAIN_AFFIXES.length).toBeGreaterThan(0);
    expect(GOBLET_MAIN_AFFIXES.length).toBeGreaterThan(0);
    expect(CIRCLET_MAIN_AFFIXES.length).toBeGreaterThan(0);
    expect(ARTIFACT_MINOR_AFFIXES.length).toBeGreaterThan(0);
  });
});
