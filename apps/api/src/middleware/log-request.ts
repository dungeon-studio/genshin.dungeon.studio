// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createMiddleware } from 'hono/factory';
import type { Logger } from 'pino';

import { logger } from '@/logger.js';

export type RequestLogVariables = {
  logger: Logger;
};

/**
 * Binds a child logger to the context so downstream code logs the request's
 * method and path without threading them through its own signature.
 *
 * Register first: everything after it reads `logger` off the context.
 */
export const logRequest = createMiddleware<{ Variables: RequestLogVariables }>(async (c, next) => {
  const requestLogger = logger.child({ method: c.req.method, path: c.req.path });
  c.set('logger', requestLogger);

  const start = performance.now();
  await next();

  requestLogger.info(
    { status: c.res.status, durationMs: Math.round(performance.now() - start) },
    'request completed',
  );
});
