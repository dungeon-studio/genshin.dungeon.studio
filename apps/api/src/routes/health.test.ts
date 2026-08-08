// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Ajv2020 } from 'ajv/dist/2020.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { app } from '@/app.js';
import { healthGetResponseV1 } from '@/profiles/json-schema/health/get-response-v1.js';

const ajv = new Ajv2020();
const validateGetSchema = ajv.compile(healthGetResponseV1.schema);

const EXPECTED_CONTENT_TYPE =
  'application/json; profile="http://localhost/profiles/json-schema/health/get-response-v1.json"';

describe('GET /health', () => {
  let res: Response;

  beforeEach(async () => {
    res = await app.request('/health');
  });

  it('returns 200 with a response matching the health schema', async () => {
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    const body = await res.json();
    expect(validateGetSchema(body)).toBe(true);
  });

  it('reports the instance as live', async () => {
    const body = (await res.json()) as { status: string };
    expect(body.status).toBe('ok');
  });
});

// The deploy pipeline reads `sha` to confirm the instance answering is the one
// it just pushed, so the field has to track APP_GIT_SHA rather than being
// stamped at build time.
describe('GET /health build identity', () => {
  const original = process.env.APP_GIT_SHA;

  afterEach(() => {
    if (original === undefined) delete process.env.APP_GIT_SHA;
    else process.env.APP_GIT_SHA = original;
  });

  it('reports the commit the instance was built from', async () => {
    process.env.APP_GIT_SHA = 'c0ffee';
    const res = await app.request('/health');
    const body = (await res.json()) as { sha: string | null };
    expect(body.sha).toBe('c0ffee');
  });

  it('reports null when the build left the commit unset', async () => {
    delete process.env.APP_GIT_SHA;
    const res = await app.request('/health');
    const body = (await res.json()) as { sha: string | null };
    expect(body.sha).toBeNull();
  });
});

describe('GET /health content negotiation', () => {
  it('refuses an Accept header it cannot satisfy', async () => {
    const res = await app.request('/health', { headers: { Accept: 'text/html' } });
    expect(res.status).toBe(406);
  });
});
