// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { STATUS_CODES } from 'node:http';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';

import {
  ABOUT_BLANK,
  INTERNAL_ERROR_DETAIL,
  problemResponse,
  problemTypeOf,
} from '@/http/problem.js';
import { allow } from '@/middleware/allow.js';
import type { AuthVariables } from '@/middleware/auth.js';
import type { RequestLogVariables } from '@/middleware/log-request.js';
import { logRequest } from '@/middleware/log-request.js';
import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';
import { isFirestoreError, toHttpException } from '@/repositories/firestore/error.js';
import { account } from '@/routes/account.js';
import { alpsProfiles } from '@/routes/alps-profiles.js';
import { characters } from '@/routes/characters.js';
import { health } from '@/routes/health.js';
import { jsonSchemaProfiles } from '@/routes/json-schema-profiles.js';
import { root } from '@/routes/root.js';
import { teams } from '@/routes/teams.js';
import { weapons } from '@/routes/weapons.js';

export const app = new Hono<{
  Variables: Partial<AuthVariables> & NegotiatedResponseContentVariables & RequestLogVariables;
}>();

// Must run first; everything after it reads the request logger off the context
app.use('*', logRequest);

// Must precede CORS, which short-circuits OPTIONS before this could run
app.use('*', allow(app));

// CORS middleware - allow frontend origin
const rawFrontendOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
const frontendOrigin = rawFrontendOrigin.trim();
if (frontendOrigin === '' || frontendOrigin === '*') {
  throw new Error("FRONTEND_ORIGIN must be a specific origin; '*' is not valid.");
}
app.use(
  '*',
  cors({
    origin: frontendOrigin,
    credentials: true,
  }),
);

// Error handling middleware — RFC 9457 Problem Details
app.onError((err, c) => {
  const resolved = isFirestoreError(err) ? toHttpException(err) : err;

  if (resolved instanceof HTTPException) {
    return problemResponse(c, {
      type: problemTypeOf(resolved),
      title: STATUS_CODES[resolved.status] ?? 'Unknown Error',
      status: resolved.status,
      detail: resolved.message,
    });
  }

  c.get('logger').error({ err: resolved }, 'request failed unexpectedly');
  return problemResponse(c, {
    type: ABOUT_BLANK,
    title: 'Internal Server Error',
    status: 500,
    detail: INTERNAL_ERROR_DETAIL,
  });
});

// 404 handler for unmatched routes — RFC 9457 Problem Details
app.notFound((c) =>
  problemResponse(c, {
    type: ABOUT_BLANK,
    title: 'Not Found',
    status: 404,
    detail: 'The requested resource does not exist',
  }),
);

// Routes
app.route('/health', health);
app.route('/profiles/json-schema', jsonSchemaProfiles);
app.route('/profiles/alps', alpsProfiles);
app.route('/account', account);
app.route('/characters', characters);
app.route('/teams', teams);
app.route('/weapons', weapons);

// Root must be registered after all other routes so it can discover them
app.route('/', root(app));
