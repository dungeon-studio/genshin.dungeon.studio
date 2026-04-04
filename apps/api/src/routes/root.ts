// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { NegotiatedContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import { rootGetResponseV1 } from '@/schemas/root/get-response-v1.js';
import type { Env, Hono as HonoApp } from 'hono';
import { Hono } from 'hono';
import { findTargetHandler, isMiddleware } from 'hono/utils/handler';

/**
 * Discover top-level resource paths from the app's registered routes.
 * Returns GET-accessible paths that have a discrete handler (e.g.
 * `/api/characters`, `/health`).
 *
 * Excludes the root path itself, wildcard catch-all routes (like `/profiles/*`),
 * and sub-resource paths that contain route parameters.
 */
function discoverLinks<E extends Env>(app: HonoApp<E>): Record<string, { href: string }> {
  const seen = new Set<string>();
  const links: Record<string, { href: string }> = {};

  for (const route of app.routes) {
    if (route.method !== 'GET') continue;
    if (isMiddleware(findTargetHandler(route.handler))) continue;

    const path = route.path;

    // Skip root, wildcards, and parameterized sub-resources
    if (path === '/' || path.includes('*') || path.includes(':')) continue;
    if (seen.has(path)) continue;
    seen.add(path);

    // Derive a name from the last path segment: /api/characters → characters
    const segments = path.split('/').filter(Boolean);
    const name = segments[segments.length - 1];
    links[name] = { href: path };
  }

  return links;
}

export function root<E extends Env>(
  app: HonoApp<E>,
): Hono<{ Variables: NegotiatedContentVariables }> {
  const links = discoverLinks(app);
  const router = new Hono<{ Variables: NegotiatedContentVariables }>();

  router.get(
    '/',
    negotiateContent([{ mediaType: 'application/json', profile: rootGetResponseV1 }]),
    (c) => c.json({ links }, 200, { 'Content-Type': c.get('negotiatedMediaType') }),
  );

  return router;
}
