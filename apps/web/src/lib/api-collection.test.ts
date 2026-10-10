// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { buildCollection, buildItem } from '@genshin/collection-json';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/msw/server';

import { apiGetAllItems } from './api-collection';

const BASE = 'http://localhost:8080/weapons';
const NEXT = `${BASE}?cursor=page-2`;

describe('apiGetAllItems', () => {
  it('follows next links and returns every page’s items in order', async () => {
    server.use(
      http.get(BASE, ({ request }) =>
        HttpResponse.json(
          new URL(request.url).searchParams.get('cursor') === 'page-2'
            ? buildCollection(BASE, [buildItem(`${BASE}/b`, [])])
            : buildCollection(BASE, [buildItem(`${BASE}/a`, [])], {
                links: [{ rel: 'next', href: NEXT }],
              }),
        ),
      ),
    );

    const items = await apiGetAllItems('/weapons');

    expect(items.map((item) => item.href)).toEqual([`${BASE}/a`, `${BASE}/b`]);
  });
});
