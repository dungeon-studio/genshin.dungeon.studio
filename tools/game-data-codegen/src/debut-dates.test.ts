// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { debutDates } from './debut-dates.js';

describe('debutDates', () => {
  it('dates a character by the first banner featuring them', () => {
    const debutDate = debutDates({ 'kaedehara-kazuha': '2021-06-29' });

    expect(debutDate('kaedehara-kazuha', '1.6')).toBe('2021-06-29');
  });

  it('dates launch characters to release day ahead of any banner', () => {
    const debutDate = debutDates({ klee: '2020-10-20' });

    expect(debutDate('klee', '1.0')).toBe('2020-09-28');
    expect(debutDate('amber', '1.0')).toBe('2020-09-28');
  });

  it('names a post-launch character no banner features', () => {
    const debutDate = debutDates({});

    expect(() => debutDate('nefer', '6.0')).toThrow('"nefer"');
  });
});
