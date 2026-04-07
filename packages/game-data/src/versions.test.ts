// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { CHARACTERS } from './characters.js';
import { compareVersions, GAME_DATA_VERSION } from './versions.js';

describe('compareVersions', () => {
  describe('numeric versions', () => {
    it('returns negative when a comes before b', () => {
      expect(compareVersions('1.0', '2.0')).toBeLessThan(0);
    });

    it('returns positive when a comes after b', () => {
      expect(compareVersions('3.0', '1.0')).toBeGreaterThan(0);
    });

    it('returns zero for equal versions', () => {
      expect(compareVersions('3.2', '3.2')).toBe(0);
    });

    it('compares minor versions within the same major', () => {
      expect(compareVersions('1.0', '1.1')).toBeLessThan(0);
      expect(compareVersions('5.8', '5.3')).toBeGreaterThan(0);
    });

    it('handles multi-digit minor versions correctly', () => {
      expect(compareVersions('5.9', '5.10')).toBeLessThan(0);
    });

    it('treats a single-segment version as minor zero', () => {
      expect(compareVersions('2', '2.0')).toBe(0);
    });
  });

  describe('Luna versions', () => {
    it('orders Luna versions sequentially', () => {
      expect(compareVersions('Luna I', 'Luna II')).toBeLessThan(0);
      expect(compareVersions('Luna II', 'Luna III')).toBeLessThan(0);
      expect(compareVersions('Luna III', 'Luna IV')).toBeLessThan(0);
    });

    it('returns zero for equal Luna versions', () => {
      expect(compareVersions('Luna I', 'Luna I')).toBe(0);
    });

    it('places Luna versions after numeric versions', () => {
      expect(compareVersions('5.8', 'Luna I')).toBeLessThan(0);
      expect(compareVersions('Luna I', '5.8')).toBeGreaterThan(0);
    });
  });

  describe('GAME_DATA_VERSION', () => {
    it('is a valid version string for compareVersions', () => {
      expect(() => compareVersions(GAME_DATA_VERSION, '1.0')).not.toThrow();
    });

    it('is >= the latest version in CHARACTERS', () => {
      const maxCharacterVersion = CHARACTERS.reduce(
        (max, c) => (compareVersions(c.version, max) > 0 ? c.version : max),
        CHARACTERS[0].version,
      );
      expect(compareVersions(GAME_DATA_VERSION, maxCharacterVersion)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('invalid versions', () => {
    it('throws for non-numeric strings', () => {
      expect(() => compareVersions('abc', '1.0')).toThrow('Invalid version string: "abc"');
    });

    it('throws for empty strings', () => {
      expect(() => compareVersions('', '1.0')).toThrow('Invalid version string: ""');
    });

    it('throws for trailing dot', () => {
      expect(() => compareVersions('5.', '1.0')).toThrow('Invalid version string: "5."');
    });

    it('throws for extra segments', () => {
      expect(() => compareVersions('1.2.3', '1.0')).toThrow('Invalid version string: "1.2.3"');
    });
  });
});
