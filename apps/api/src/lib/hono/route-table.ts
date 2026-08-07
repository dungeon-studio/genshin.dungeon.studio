// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Env, Hono } from 'hono';
import { METHOD_NAME_ALL } from 'hono/router';
import type { H } from 'hono/types';
import { findTargetHandler, isMiddleware } from 'hono/utils/handler';

/**
 * Whether a registered handler serves a route rather than wrapping one.
 *
 * Hono keeps both in one table, distinguished only by arity.
 */
export function isRouteHandler(handler: H): boolean {
  return !isMiddleware(findTargetHandler(handler));
}

/** The methods the app routes at `path`, empty when nothing is routed there. */
export function routedMethods<E extends Env>(app: Hono<E>, path: string): string[] {
  const registered = new Set(
    app.routes.map((route) => route.method).filter((method) => method !== METHOD_NAME_ALL),
  );

  return [...registered].filter((method) => {
    const [matches] = app.router.match(method, path);
    return matches.some(([[handler]]) => isRouteHandler(handler));
  });
}
