// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';

/**
 * A JSON response served as the media type `negotiateContent` picked.
 *
 * A `Content-Type` in `headers` is ignored, so a route serves only the
 * representation it negotiated.
 */
export function negotiatedJson<E extends { Variables: NegotiatedResponseContentVariables }>(
  c: Context<E>,
  body: unknown,
  status: ContentfulStatusCode = 200,
  headers: Record<string, string> = {},
): Response {
  return c.body(JSON.stringify(body), status, {
    ...headers,
    'Content-Type': c.get('negotiatedMediaType'),
  });
}
