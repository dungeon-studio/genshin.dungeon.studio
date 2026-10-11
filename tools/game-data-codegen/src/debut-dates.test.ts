// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { debutDates } from './debut-dates.js';

describe('debutDates', () => {
  it('dates a character by the earliest banner that rates them up', () => {
    const debutDate = debutDates([
      { start: '2022-03-30 18:00:00', featured: ['kaedehara_kazuha'], featuredRare: [] },
      { start: '2021-06-29 18:00:00', featured: ['klee'], featuredRare: ['kaedehara_kazuha'] },
    ]);

    expect(debutDate('kaedehara-kazuha', '1.6')).toBe('2021-06-29');
  });

  it('dates launch characters to release day ahead of any banner', () => {
    const debutDate = debutDates([
      { start: '2020-10-20 18:00:00', featured: ['klee'], featuredRare: [] },
    ]);

    expect(debutDate('klee', '1.0')).toBe('2020-09-28');
    expect(debutDate('amber', '1.0')).toBe('2020-09-28');
  });

  it('names a post-launch character no banner rates up', () => {
    const debutDate = debutDates([]);

    expect(() => debutDate('nefer', '6.0')).toThrow('"nefer"');
  });
});
