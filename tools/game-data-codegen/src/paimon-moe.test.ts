// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { firstRateUps, renderRateUpDates, toCharacterBanners } from './paimon-moe.js';

describe('toCharacterBanners', () => {
  it('rejects a module whose banners lack a rate-up list', () => {
    const reshaped = { banners: { characters: [{ start: '2020-09-28 00:00:00', featured: [] }] } };

    expect(() => toCharacterBanners(reshaped)).toThrow('no longer exports character banners');
  });
});

describe('firstRateUps', () => {
  it('keeps the earliest banner across five-star and four-star rate-ups', () => {
    const dates = firstRateUps([
      { start: '2022-03-30 18:00:00', featured: ['kaedehara_kazuha'], featuredRare: [] },
      { start: '2021-06-29 18:00:00', featured: ['klee'], featuredRare: ['kaedehara_kazuha'] },
    ]);

    expect(dates.get('kaedehara-kazuha')).toBe('2021-06-29');
  });
});

describe('renderRateUpDates', () => {
  const rendered = renderRateUpDates(
    new Map([
      ['kaedehara-kazuha', '2021-06-29'],
      ['albedo', '2020-12-23'],
    ]),
  );

  it('credits paimon-moe in the SPDX header', () => {
    // REUSE-IgnoreStart
    expect(rendered).toMatch(/^\/\/ SPDX-FileCopyrightText: 2021 Made Baruna$/m);
    // REUSE-IgnoreEnd
  });

  it('sorts by id and quotes only the keys Prettier would', () => {
    expect(rendered).toContain(
      "= {\n  albedo: '2020-12-23',\n  'kaedehara-kazuha': '2021-06-29',\n};",
    );
  });
});
