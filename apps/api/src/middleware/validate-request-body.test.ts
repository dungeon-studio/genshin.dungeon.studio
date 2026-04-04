// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { ValidatedRequestBodyVariables } from './validate-request-body.js';
import { validateRequestBody } from './validate-request-body.js';

const schemaV1: JsonSchemaProfile = {
  path: '/profiles/json-schema/test/put-request-v1.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: { name: { type: 'string' } },
    required: ['name'],
    additionalProperties: false,
  },
};

const schemaV2: JsonSchemaProfile = {
  path: '/profiles/json-schema/test/put-request-v2.json',
  schema: {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    type: 'object',
    properties: { name: { type: 'string' }, level: { type: 'integer' } },
    required: ['name', 'level'],
    additionalProperties: false,
  },
};

describe('validateRequestBody middleware', () => {
  function createApp(schemas: JsonSchemaProfile[], negotiatedPath: string) {
    const app = new Hono<{
      Variables: NegotiatedRequestSchemaVariables & ValidatedRequestBodyVariables;
    }>();
    app.put(
      '/test',
      async (c, next) => {
        c.set('negotiatedSchema', negotiatedPath);
        await next();
      },
      validateRequestBody(schemas),
      (c) => {
        return c.json({ body: c.get('validatedBody') }, 200);
      },
    );
    return app;
  }

  function putRequest(body: unknown) {
    return new Request('http://localhost/test', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('sets validatedBody when body conforms to negotiated schema', async () => {
    const app = createApp([schemaV1], schemaV1.path);
    const res = await app.request(putRequest({ name: 'test' }));

    expect(res.status).toBe(200);
    const json = (await res.json()) as { body: unknown };
    expect(json.body).toEqual({ name: 'test' });
  });

  it('validates against v2 schema when negotiated path is v2', async () => {
    const app = createApp([schemaV2, schemaV1], schemaV2.path);
    const res = await app.request(putRequest({ name: 'test', level: 5 }));

    expect(res.status).toBe(200);
    const json = (await res.json()) as { body: unknown };
    expect(json.body).toEqual({ name: 'test', level: 5 });
  });

  it('returns 422 when body fails the negotiated schema', async () => {
    const app = createApp([schemaV2, schemaV1], schemaV2.path);
    const res = await app.request(putRequest({ name: 'test' }));

    expect(res.status).toBe(422);
  });

  it('returns 422 when body has extra properties', async () => {
    const app = createApp([schemaV1], schemaV1.path);
    const res = await app.request(putRequest({ name: 'test', extra: true }));

    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid JSON body', async () => {
    const app = createApp([schemaV1], schemaV1.path);
    const res = await app.request(
      new Request('http://localhost/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: 'not-json',
      }),
    );

    expect(res.status).toBe(400);
  });
});
