// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionDocument } from '@genshin/collection-json';

import { app } from '@/app.js';
import { routedMethods } from '@/http/route-table.js';

function hrefsOf(targets: { href: string }[] = []): string[] {
  return targets.map((target) => target.href);
}

function documentHrefs({ collection }: CollectionDocument): string[] {
  return [
    collection.href,
    ...hrefsOf(collection.links),
    ...hrefsOf(collection.queries),
    ...collection.items.flatMap((item) => [item.href, ...hrefsOf(item.links)]),
  ];
}

function isRoutedAsGet(href: string): boolean {
  return routedMethods(app, new URL(href).pathname).includes('GET');
}

/** Matches pathnames only, so a query string an href carries goes unchecked. */
export function unroutedHrefs(document: CollectionDocument): string[] {
  return documentHrefs(document).filter((href) => !isRoutedAsGet(href));
}
