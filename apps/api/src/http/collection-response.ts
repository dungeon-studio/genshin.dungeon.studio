// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionDocument } from '@genshin/collection-json';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';

/**
 * Sends a Collection+JSON document as the media type content negotiation chose,
 * profile parameter included.
 *
 * Uses `c.body()`, not `c.json()`: handed a `ResponseInit`, `c.json()` overwrites
 * the Content-Type it carried with `application/json`.
 */
export function collectionResponse<E extends { Variables: NegotiatedResponseContentVariables }>(
  c: Context<E>,
  document: CollectionDocument,
  status: ContentfulStatusCode = 200,
  headers: Record<string, string> = {},
): Response {
  return c.body(JSON.stringify(document), {
    status,
    headers: { ...headers, 'Content-Type': c.get('negotiatedMediaType') },
  });
}
