// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import type { DecodedIdToken } from '@/firebase/auth.js';
import { verifyToken } from '@/firebase/auth.js';
import type { RequestLogVariables } from '@/middleware/log-request.js';

export type AuthVariables = {
  user: DecodedIdToken;
};

const MALFORMED_AUTH_MESSAGE = 'Missing or malformed Authorization header';

export const auth = createMiddleware<{ Variables: AuthVariables & RequestLogVariables }>(
  async (c, next) => {
    const header = c.req.header('Authorization');
    if (!header) {
      throw new HTTPException(401, { message: MALFORMED_AUTH_MESSAGE });
    }

    const parts = header.trim().split(/\s+/);
    const scheme = parts[0]?.toLowerCase();
    const token = parts[1];

    if (scheme !== 'bearer' || !token || parts.length !== 2) {
      throw new HTTPException(401, { message: MALFORMED_AUTH_MESSAGE });
    }

    try {
      const decoded = await verifyToken(token);
      c.set('user', decoded);
    } catch (error) {
      const code = (error as { code?: string } | null | undefined)?.code;
      if (code?.startsWith('auth/')) {
        throw new HTTPException(401, { message: 'Invalid or expired token' });
      }

      // The request logger already carries the method and path.
      c.get('logger').error({ err: error }, 'token verification failed unexpectedly');
      throw new HTTPException(500, { message: 'Internal server error' });
    }

    await next();
  },
);
