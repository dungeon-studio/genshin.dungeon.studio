// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionDocument } from '@genshin/collection-json';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';

export function collectionResponse<E extends { Variables: NegotiatedResponseContentVariables }>(
  c: Context<E>,
  document: CollectionDocument,
  status: ContentfulStatusCode = 200,
  headers: Record<string, string> = {},
): Response {
  // `c.json()` overwrites Content-Type with `application/json`, dropping the
  // negotiated media type and its profile parameter.
  return c.body(JSON.stringify(document), {
    status,
    headers: { ...headers, 'Content-Type': c.get('negotiatedMediaType') },
  });
}
