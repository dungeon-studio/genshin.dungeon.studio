// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { buildArtifactSets } from './artifacts.js';

describe('buildArtifactSets', () => {
  const sets = buildArtifactSets();

  it('returns a nonempty roster', () => {
    expect(sets.length).toBeGreaterThan(0);
  });

  it('produces unique, nonempty ids', () => {
    const ids = sets.map((set) => set.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it('carries both set bonuses', () => {
    for (const set of sets) {
      expect(set.bonuses[2]).not.toBe('');
      expect(set.bonuses[4]).not.toBe('');
    }
  });

  it('sorts by version descending', () => {
    const outOfOrder = sets
      .slice(1)
      .filter((current, index) => compareVersions(sets[index].version, current.version) < 0);

    expect(outOfOrder).toEqual([]);
  });
});
