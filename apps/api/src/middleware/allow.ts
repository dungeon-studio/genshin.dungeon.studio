// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Env, Hono, MiddlewareHandler } from 'hono';

import { routedMethods } from '@/lib/hono/route-table.js';

/**
 * The methods to advertise at `path`, or an empty array when nothing is routed
 * there.
 */
function allowedMethods<E extends Env>(app: Hono<E>, path: string): string[] {
  const methods = routedMethods(app, path);
  if (methods.length === 0) return [];

  // Hono answers HEAD by dispatching the GET route, so it is never registered.
  if (methods.includes('GET')) methods.push('HEAD');
  methods.push('OPTIONS');

  return methods.sort();
}

/**
 * `Allow` header middleware — RFC 9110 §10.2.1.
 *
 * Answers `OPTIONS` with the methods the requested resource supports, derived
 * from the app's own routing table so it cannot drift from the routes.
 *
 * Must be registered before the CORS middleware: that middleware short-circuits
 * every `OPTIONS` request into a 204 built from the headers prepared so far, so
 * a header set after it never reaches the response.
 */
export function allow<E extends Env>(app: Hono<E>): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === 'OPTIONS') {
      const methods = allowedMethods(app, c.req.path);
      if (methods.length > 0) c.header('Allow', methods.join(', '));
    }

    await next();
  };
}
