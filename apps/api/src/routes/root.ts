// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Env, Hono as HonoApp } from 'hono';
import { Hono } from 'hono';

import { negotiatedJson } from '@/http/negotiated-response.js';
import { isRouteHandler } from '@/http/route-table.js';
import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import { rootGetResponseV1 } from '@/profiles/json-schema/root/get-response-v1.js';

/**
 * Discover top-level resource paths from the app's registered routes.
 * Returns single-segment, GET-accessible paths that have a discrete handler
 * (e.g. `/characters`, `/health`), keyed by that segment.
 *
 * Deeper paths are sub-resources or descriptor documents such as
 * `/profiles/json-schema/teams/put-request-v1.json`, which clients reach
 * through the `profile` parameter on `Content-Type` instead.
 */
function discoverLinks<E extends Env>(app: HonoApp<E>): Record<string, { href: string }> {
  return Object.fromEntries(
    app.routes
      .filter(
        ({ method, path, handler }) =>
          method === 'GET' && isTopLevelPath(path) && isRouteHandler(handler),
      )
      .map(({ path }): [string, { href: string }] => [path.slice(1), { href: path }]),
  );
}

/** Whether `path` is a single literal segment, with no parameter or wildcard. */
function isTopLevelPath(path: string): boolean {
  return /^\/[^/:*]+$/.test(path);
}

/**
 * The entry point document, linking to every top-level resource the app serves.
 *
 * Reads the routing table once, when this is called, so it has to be registered
 * after every other route. Registering it earlier yields a document linking to
 * only the routes that existed at that moment, which fails silently.
 */
export function root<E extends Env>(
  app: HonoApp<E>,
): Hono<{ Variables: NegotiatedResponseContentVariables }> {
  const links = discoverLinks(app);
  const router = new Hono<{ Variables: NegotiatedResponseContentVariables }>();

  router.get(
    '/',
    negotiateContent([{ mediaType: 'application/json', profile: rootGetResponseV1 }]),
    (c) => negotiatedJson(c, { links }),
  );

  return router;
}
