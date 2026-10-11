// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  fetchCharacterBanners,
  firstBannerDates,
  serializeFirstBannerDates,
  toCharacterBanners,
} from './paimon-moe.js';

describe('fetchCharacterBanners', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('evaluates the fetched module for its character banners', async () => {
    const venti = { start: '2020-09-28 00:00:00', featured: ['venti'], featuredRare: [] };
    const source = `export const banners = { characters: [${JSON.stringify(venti)}] };`;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(source)));

    await expect(fetchCharacterBanners()).resolves.toEqual([venti]);
  });

  it('fails on an unsuccessful response', async () => {
    const notFound = new Response('', { status: 404, statusText: 'Not Found' });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(notFound));

    await expect(fetchCharacterBanners()).rejects.toThrow('404 Not Found');
  });
});

describe('toCharacterBanners', () => {
  it.each([
    ['no banners export', {}],
    ['a banner that is not an object', { banners: { characters: ['venti'] } }],
    [
      'a banner without a four-star list',
      { banners: { characters: [{ start: '2020-09-28 00:00:00', featured: [] }] } },
    ],
  ])('rejects a module with %s', (_shape, module) => {
    expect(() => toCharacterBanners(module)).toThrow('no longer exports character banners');
  });
});

describe('firstBannerDates', () => {
  it('keeps the earliest banner featuring a character, whatever order banners arrive in', () => {
    const dates = firstBannerDates([
      { start: '2022-03-30 18:00:00', featured: ['kaedehara_kazuha'], featuredRare: [] },
      { start: '2021-06-29 18:00:00', featured: ['klee'], featuredRare: ['kaedehara_kazuha'] },
      { start: '2023-08-01 18:00:00', featured: ['kaedehara_kazuha'], featuredRare: [] },
    ]);

    expect(dates.get('kaedehara-kazuha')).toBe('2021-06-29');
  });
});

describe('serializeFirstBannerDates', () => {
  it('sorts by id and quotes only the keys Prettier would', () => {
    const entries = serializeFirstBannerDates(
      new Map([
        ['kaedehara-kazuha', '2021-06-29'],
        ['albedo', '2020-12-23'],
      ]),
    );

    expect(entries).toEqual(["  albedo: '2020-12-23',", "  'kaedehara-kazuha': '2021-06-29',"]);
  });
});
