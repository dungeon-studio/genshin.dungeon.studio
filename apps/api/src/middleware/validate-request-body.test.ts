// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';

import { problemTypeOf } from '@/http/problem.js';
import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

import type { ValidatedRequestBodyVariables } from './validate-request-body.js';
import { validateRequestBody } from './validate-request-body.js';

function putRequestSchema(
  version: string,
  properties: Record<string, unknown>,
  required: string[],
): JsonSchemaProfile {
  return {
    path: `/profiles/json-schema/test/put-request-${version}.json`,
    schema: {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      properties,
      required,
      additionalProperties: false,
    },
  };
}

const schemaV1 = putRequestSchema('v1', { name: { type: 'string' } }, ['name']);

const schemaV2 = putRequestSchema(
  'v2',
  { name: { type: 'string' }, level: { type: 'integer', minimum: 1, maximum: 10 } },
  ['name', 'level'],
);

// `pattern` has no entry in the keyword mapping, so this fixture reaches the
// classification fallback.
const schemaUnmapped = putRequestSchema(
  'unmapped-v1',
  { name: { type: 'string', pattern: '^[a-z]+$' } },
  ['name'],
);

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
    // Stands in for the application error handler, which is what actually puts
    // `type` on the wire; this one only exposes what the middleware threw.
    app.onError((err, c) =>
      c.json({ type: problemTypeOf(err) }, err instanceof HTTPException ? err.status : 500),
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

  async function problemType(schema: JsonSchemaProfile, body: unknown) {
    const res = await createApp([schema], schema.path).request(putRequest(body));
    const json = (await res.json()) as { type: string };
    return json.type;
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

  describe('problem type classification', () => {
    const categories = [
      {
        failure: 'a missing required property',
        schema: schemaV2,
        body: { level: 5 },
        type: '/problems/validation/missing-property',
      },
      {
        failure: 'a property of the wrong type',
        schema: schemaV2,
        body: { name: 42, level: 5 },
        type: '/problems/validation/invalid-type',
      },
      {
        failure: 'a property outside its permitted range',
        schema: schemaV2,
        body: { name: 'test', level: 99 },
        type: '/problems/validation/out-of-range',
      },
      {
        failure: 'an unexpected property',
        schema: schemaV1,
        body: { name: 'test', extra: true },
        type: '/problems/validation/additional-properties',
      },
    ];

    it.each(categories)('classifies $failure', async ({ schema, body, type }) => {
      await expect(problemType(schema, body)).resolves.toBe(type);
    });

    it('widens to the parent type when failures span categories', async () => {
      await expect(problemType(schemaV2, { level: 99, extra: true })).resolves.toBe(
        '/problems/validation',
      );
    });

    it('falls back to the parent type for a constraint outside the vocabulary', async () => {
      await expect(problemType(schemaUnmapped, { name: 'UPPERCASE' })).resolves.toBe(
        '/problems/validation',
      );
    });
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
