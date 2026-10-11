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
  const links: Record<string, { href: string }> = {};

  for (const route of app.routes) {
    if (route.method !== 'GET') continue;
    if (!isRouteHandler(route.handler)) continue;

    const match = /^\/([^/:*]+)$/.exec(route.path);
    if (match?.[1] === undefined) continue;
    links[match[1]] = { href: route.path };
  }

  return links;
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
