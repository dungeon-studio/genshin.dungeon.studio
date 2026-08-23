// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readFileSync } from 'node:fs';

import { Hono } from 'hono';

import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import { healthGetResponseV1 } from '@/profiles/json-schema/health/get-response-v1.js';

const { version: apiVersion } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8'),
) as { version: string };

/**
 * Liveness plus the identity of what is running, for a deployment check that
 * has no credentials.
 *
 * Unauthenticated on purpose. It reports the package version and the build's
 * git SHA without probing dependencies, so a green response says nothing about
 * whether storage is reachable.
 */
export const health = new Hono<{ Variables: NegotiatedResponseContentVariables }>();

health.get(
  '/',
  negotiateContent([{ mediaType: 'application/json', profile: healthGetResponseV1 }]),
  (c) =>
    c.json(
      {
        status: 'ok',
        version: apiVersion,
        sha: process.env.APP_GIT_SHA ?? null,
      },
      200,
      { 'Content-Type': c.get('negotiatedMediaType') },
    ),
);
