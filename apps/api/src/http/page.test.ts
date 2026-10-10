// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { buildCollection } from '@genshin/collection-json';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';

import type { Page, PageRequest } from '@/repositories/firestore/page.js';

import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, linkNextPage, parsePageRequest } from './page.js';

const BASE = 'http://localhost/items';

async function parse(query: string): Promise<PageRequest | number> {
  const app = new Hono();
  app.get('/items', (c) => c.json(parsePageRequest(c)));
  app.onError((err) => {
    if (err instanceof HTTPException) return new Response(null, { status: err.status });
    throw err;
  });

  const res = await app.request(`${BASE}${query}`);

  return res.ok ? ((await res.json()) as PageRequest) : res.status;
}

async function linksFor(query: string, page: Page<unknown>) {
  const app = new Hono();
  app.get('/items', (c) =>
    c.json(linkNextPage(c, page, buildCollection(BASE, [])).collection.links ?? []),
  );

  const res = await app.request(`${BASE}${query}`);

  return res.json();
}

describe('parsePageRequest', () => {
  it('applies the default limit when none is given', async () => {
    expect(await parse('')).toEqual({ limit: DEFAULT_PAGE_LIMIT });
  });

  it('accepts the maximum limit', async () => {
    expect(await parse(`?limit=${MAX_PAGE_LIMIT}`)).toEqual({ limit: MAX_PAGE_LIMIT });
  });

  it.each([
    ['above the maximum', `${MAX_PAGE_LIMIT + 1}`],
    ['zero', '0'],
    ['negative', '-1'],
    ['fractional', '1.5'],
    ['not a number', 'ten'],
    ['empty', ''],
    ['zero-padded', '01'],
  ])('rejects a limit that is %s', async (_, limit) => {
    expect(await parse(`?limit=${limit}`)).toBe(400);
  });

  it('reads back the document ID a next link encoded', async () => {
    const [link] = (await linksFor('', { items: [], next: 'doc-42' })) as [{ href: string }];
    const cursor = new URL(link.href).searchParams.get('cursor') ?? '';

    expect(await parse(`?cursor=${cursor}`)).toEqual({
      limit: DEFAULT_PAGE_LIMIT,
      after: 'doc-42',
    });
  });

  it.each([
    ['empty', ''],
    ['not base64url', '!!!'],
    ['a path rather than a document ID', Buffer.from('a/b').toString('base64url')],
  ])('rejects a cursor that is %s', async (_, cursor) => {
    expect(await parse(`?cursor=${encodeURIComponent(cursor)}`)).toBe(400);
  });
});

describe('linkNextPage', () => {
  it('omits next on the last page', async () => {
    expect(await linksFor('?limit=2', { items: [] })).toEqual([]);
  });

  it('carries the request query into the next link', async () => {
    const [link] = (await linksFor('?weaponId=x&limit=2&cursor=old', {
      items: [],
      next: 'doc-42',
    })) as [{ rel: string; href: string }];
    const url = new URL(link.href);

    expect(link.rel).toBe('next');
    expect(url.searchParams.get('weaponId')).toBe('x');
    expect(url.searchParams.get('limit')).toBe('2');
    expect(url.searchParams.get('cursor')).not.toBe('old');
  });
});
