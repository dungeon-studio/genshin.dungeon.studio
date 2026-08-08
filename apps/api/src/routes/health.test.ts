// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Ajv2020 } from 'ajv/dist/2020.js';
import type { FromSchema } from 'json-schema-to-ts';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/app.js';
import { healthGetResponseV1 } from '@/profiles/json-schema/health/get-response-v1.js';

const ajv = new Ajv2020();
const validateGetSchema = ajv.compile(healthGetResponseV1.schema);

const EXPECTED_CONTENT_TYPE =
  'application/json; profile="http://localhost/profiles/json-schema/health/get-response-v1.json"';

type HealthResponse = FromSchema<typeof healthGetResponseV1.schema>;

async function getHealth(headers?: Record<string, string>): Promise<Response> {
  return app.request('/health', { headers });
}

async function getHealthBody(): Promise<HealthResponse> {
  const res = await getHealth();
  return (await res.json()) as HealthResponse;
}

describe('GET /health', () => {
  it('returns 200 with a response matching the health schema', async () => {
    const res = await getHealth();
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    const body = await res.json();
    expect(validateGetSchema(body)).toBe(true);
  });

  it('reports the instance as live', async () => {
    expect((await getHealthBody()).status).toBe('ok');
  });

  // The deploy pipeline compares `sha` against the commit it just pushed, so
  // this has to reflect the environment of the process actually answering.
  describe('build identity', () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('reports the commit the instance was built from', async () => {
      vi.stubEnv('APP_GIT_SHA', 'c0ffee');
      expect((await getHealthBody()).sha).toBe('c0ffee');
    });

    it('reports null when the build left the commit unset', async () => {
      vi.stubEnv('APP_GIT_SHA', undefined);
      expect((await getHealthBody()).sha).toBeNull();
    });
  });

  describe('content negotiation', () => {
    it('refuses an Accept header it cannot satisfy', async () => {
      const res = await getHealth({ Accept: 'text/html' });
      expect(res.status).toBe(406);
    });
  });
});
