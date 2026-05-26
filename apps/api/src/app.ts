// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import type { NegotiatedContentVariables } from '@/middleware/negotiate-content.js';
import { firestoreErrorToHttpException } from '@/repositories/firestore-error.js';
import { alpsProfiles } from '@/routes/alps-profiles.js';
import { characters } from '@/routes/characters.js';
import { jsonSchemaProfiles } from '@/routes/json-schema-profiles.js';
import { root } from '@/routes/root.js';
import { teams } from '@/routes/teams.js';
import { userProfile } from '@/routes/user-profile.js';
import { weapons } from '@/routes/weapons.js';
import type { ProblemDetail } from '@genshin/domain';
import { GoogleError } from 'google-gax';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { readFileSync } from 'node:fs';
import { STATUS_CODES } from 'node:http';

// Read version from package.json to maintain single source of truth
const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

export const PROBLEM_JSON = { 'Content-Type': 'application/problem+json' };

export const app = new Hono<{ Variables: Partial<AuthVariables> & NegotiatedContentVariables }>();

// Request logging middleware
app.use('*', logger());

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
  const resolved = err instanceof GoogleError ? firestoreErrorToHttpException(err) : err;

  if (resolved instanceof HTTPException) {
    return c.json(
      {
        type: 'about:blank',
        title: STATUS_CODES[resolved.status] ?? 'Unknown Error',
        status: resolved.status,
        detail: resolved.message,
      } satisfies ProblemDetail,
      { status: resolved.status, headers: PROBLEM_JSON },
    );
  }

  console.error('Unexpected error:', resolved);
  return c.json(
    {
      type: 'about:blank',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
    } satisfies ProblemDetail,
    { status: 500, headers: PROBLEM_JSON },
  );
});

// 404 handler for unmatched routes — RFC 9457 Problem Details
app.notFound((c) =>
  c.json(
    {
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'The requested resource does not exist',
    } satisfies ProblemDetail,
    { status: 404, headers: PROBLEM_JSON },
  ),
);

app.get('/health', (c) =>
  c.json({
    status: 'ok',
    version: packageJson.version,
    sha: process.env.APP_GIT_SHA ?? null,
  }),
);

// Routes
app.route('/profiles/json-schema', jsonSchemaProfiles);
app.route('/profiles/alps', alpsProfiles);
app.route('/api/characters', characters);
app.route('/api/profile', userProfile);
app.route('/api/teams', teams);
app.route('/api/weapons', weapons);

// Root must be registered after all other routes so it can discover them
app.route('/', root(app));
