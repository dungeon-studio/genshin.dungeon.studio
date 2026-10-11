// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { firstBannerDates, renderFirstBannerDates, toCharacterBanners } from './paimon-moe.js';

describe('toCharacterBanners', () => {
  it('rejects a module whose banners lack a featured list', () => {
    const reshaped = { banners: { characters: [{ start: '2020-09-28 00:00:00', featured: [] }] } };

    expect(() => toCharacterBanners(reshaped)).toThrow('no longer exports character banners');
  });
});

describe('firstBannerDates', () => {
  it('keeps the earliest banner featuring a character at five-star or four-star', () => {
    const dates = firstBannerDates([
      { start: '2022-03-30 18:00:00', featured: ['kaedehara_kazuha'], featuredRare: [] },
      { start: '2021-06-29 18:00:00', featured: ['klee'], featuredRare: ['kaedehara_kazuha'] },
    ]);

    expect(dates.get('kaedehara-kazuha')).toBe('2021-06-29');
  });
});

describe('renderFirstBannerDates', () => {
  const rendered = renderFirstBannerDates(
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
