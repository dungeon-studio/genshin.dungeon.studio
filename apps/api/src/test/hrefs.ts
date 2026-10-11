// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionDocument } from '@genshin/collection-json';

import { app } from '@/app.js';
import { routedMethods } from '@/http/route-table.js';

function documentHrefs({ collection }: CollectionDocument): string[] {
  return [
    collection.href,
    ...(collection.links ?? []).map((link) => link.href),
    ...(collection.queries ?? []).map((query) => query.href),
    ...collection.items.flatMap((item) => [
      item.href,
      ...(item.links ?? []).map((link) => link.href),
    ]),
  ];
}

/**
 * The hrefs in `document` whose path the app doesn't route as `GET`.
 *
 * Hrefs come from builders in `@genshin/domain` while routes mount in this
 * app, so nothing else notices when the two drift apart.
 */
export function unroutedHrefs(document: CollectionDocument): string[] {
  return documentHrefs(document).filter(
    (href) => !routedMethods(app, new URL(href).pathname).includes('GET'),
  );
}
