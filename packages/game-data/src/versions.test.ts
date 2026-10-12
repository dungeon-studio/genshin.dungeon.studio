// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { compareVersions, formatVersion, latestVersion, sameVersion } from './versions.js';

describe('compareVersions', () => {
  it('orders by major before minor', () => {
    expect(compareVersions({ major: 5, minor: 8 }, { major: 6, minor: 0 })).toBeLessThan(0);
  });

  it('orders by minor within the same major', () => {
    expect(compareVersions({ major: 5, minor: 10 }, { major: 5, minor: 9 })).toBeGreaterThan(0);
  });

  it('returns zero for equal versions', () => {
    expect(compareVersions({ major: 3, minor: 2 }, { major: 3, minor: 2 })).toBe(0);
  });
});

describe('sameVersion', () => {
  it('tells apart versions that share a major', () => {
    expect(sameVersion({ major: 5, minor: 1 }, { major: 5, minor: 10 })).toBe(false);
    expect(sameVersion({ major: 5, minor: 1 }, { major: 5, minor: 1 })).toBe(true);
  });
});

describe('latestVersion', () => {
  it('picks the newest', () => {
    const newest = { major: 5, minor: 10 };

    expect(latestVersion([{ major: 5, minor: 9 }, newest, { major: 1, minor: 0 }])).toBe(newest);
  });
});

describe('formatVersion', () => {
  it('writes major and minor as the patch notes do', () => {
    expect(formatVersion({ major: 5, minor: 10 })).toBe('5.10');
  });
});
