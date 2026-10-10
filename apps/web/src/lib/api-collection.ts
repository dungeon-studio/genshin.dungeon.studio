// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Item } from '@genshin/collection-json';
import { assertCollectionDocument } from '@genshin/collection-json';

import { apiGet } from '@/lib/api';

/**
 * Every item of a paged collection, following `next` links until the server
 * stops sending one.
 *
 * The collection and team pages need the whole collection at once, so the
 * paging stays invisible to them.
 */
export async function apiGetAllItems(path: string): Promise<Item[]> {
  const items: Item[] = [];
  let href: string | undefined = path;

  while (href !== undefined) {
    const document = await apiGet(href);
    assertCollectionDocument(document);
    items.push(...document.collection.items);
    href = document.collection.links?.find((link) => link.rel === 'next')?.href;
  }

  return items;
}
