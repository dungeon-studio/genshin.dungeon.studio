// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { toKebabCase } from './slug.js';

describe('toKebabCase', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(toKebabCase('Mistsplitter Reforged')).toBe('mistsplitter-reforged');
  });

  it('strips apostrophes rather than hyphenating them', () => {
    expect(toKebabCase("Wolf's Gravestone")).toBe('wolfs-gravestone');
    expect(toKebabCase('Amos’ Bow')).toBe('amos-bow');
  });

  it('collapses runs of punctuation and trims edges', () => {
    expect(toKebabCase('  The Catch!! ')).toBe('the-catch');
    expect(toKebabCase('Wine & Song')).toBe('wine-song');
  });
});
