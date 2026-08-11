// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { createIdAssigner, toKebabCase } from './slug.js';

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

describe('createIdAssigner', () => {
  it('rejects two names that slugify alike', () => {
    const assignId = createIdAssigner('weapon');
    assignId('The Catch');

    expect(() => assignId('The Catch!')).toThrow(/Duplicate weapon id "the-catch"/);
  });

  it('tracks names per assigner', () => {
    const assignId = createIdAssigner('weapon');
    assignId('The Catch');

    expect(createIdAssigner('weapon')('The Catch')).toBe('the-catch');
  });

  it('rejects a name with nothing to slugify', () => {
    expect(() => createIdAssigner('artifact set')('!!')).toThrow(/Empty id for artifact set/);
  });
});
