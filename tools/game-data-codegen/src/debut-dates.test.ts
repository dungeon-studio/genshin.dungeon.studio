// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { debutDates } from './debut-dates.js';

describe('debutDates', () => {
  it('dates a character by the first banner featuring them', () => {
    const debutDate = debutDates({ 'kaedehara-kazuha': '2021-06-29' });

    expect(debutDate('kaedehara-kazuha', { major: 1, minor: 6 })).toBe('2021-06-29');
  });

  it('dates launch characters to release day ahead of any banner', () => {
    const debutDate = debutDates({ klee: '2020-10-20' });

    expect(debutDate('klee', { major: 1, minor: 0 })).toBe('2020-09-28');
    expect(debutDate('amber', { major: 1, minor: 0 })).toBe('2020-09-28');
  });

  it('names a post-launch character no banner features', () => {
    const debutDate = debutDates({});

    expect(() => debutDate('nefer', { major: 6, minor: 0 })).toThrow('"nefer"');
  });
});
