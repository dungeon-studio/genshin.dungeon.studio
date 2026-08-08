// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readFileSync } from 'node:fs';

import { Hono } from 'hono';

import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import { healthGetResponseV1 } from '@/profiles/json-schema/health/get-response-v1.js';

// Read version from package.json to maintain single source of truth
const packageJson = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
);

export const health = new Hono<{ Variables: NegotiatedResponseContentVariables }>();

health.get(
  '/',
  negotiateContent([{ mediaType: 'application/json', profile: healthGetResponseV1 }]),
  (c) =>
    c.json(
      {
        status: 'ok',
        version: packageJson.version,
        sha: process.env.APP_GIT_SHA ?? null,
      },
      200,
      { 'Content-Type': c.get('negotiatedMediaType') },
    ),
);
