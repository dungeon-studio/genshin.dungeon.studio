// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { DecodedIdToken } from '@/lib/firebase/auth';
import { verifyToken } from '@/lib/firebase/auth';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

export type AuthVariables = {
  user: DecodedIdToken;
};

export const auth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const header = c.req.header('Authorization');
  if (!header) {
    throw new HTTPException(401, { message: 'Missing or malformed Authorization header' });
  }

  const parts = header.trim().split(/\s+/);
  const scheme = parts[0]?.toLowerCase();
  const token = parts[1];

  if (scheme !== 'bearer' || !token || parts.length !== 2) {
    throw new HTTPException(401, { message: 'Missing or malformed Authorization header' });
  }

  try {
    const decoded = await verifyToken(token);
    c.set('user', decoded);
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code?.startsWith('auth/')) {
      throw new HTTPException(401, { message: 'Invalid or expired token' });
    }

    console.error('Token verification failed unexpectedly:', {
      method: c.req.method,
      path: c.req.path,
      error,
    });
    throw new HTTPException(500, { message: 'Internal server error' });
  }

  await next();
});
