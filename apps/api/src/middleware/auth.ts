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
  if (!header?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing or malformed Authorization header' });
  }

  const token = header.slice(7);

  try {
    const decoded = await verifyToken(token);
    c.set('user', decoded);
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired token' });
  }

  await next();
});
