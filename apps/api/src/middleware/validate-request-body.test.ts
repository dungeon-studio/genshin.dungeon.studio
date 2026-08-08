// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { describe, expect, it } from 'vitest';

import { ProblemException } from '@/http/problem.js';
import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

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
    properties: {
      name: { type: 'string' },
      level: { type: 'integer', minimum: 1, maximum: 10 },
    },
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
    // Stands in for the application error handler, which is what actually puts
    // `type` on the wire; this one only exposes what the middleware threw.
    app.onError((err, c) =>
      c.json(
        { type: err instanceof ProblemException ? err.type : 'about:blank' },
        err instanceof HTTPException ? err.status : 500,
      ),
    );
    return app;
  }

  async function problemType(app: ReturnType<typeof createApp>, body: unknown) {
    const res = await app.request(putRequest(body));
    const json = (await res.json()) as { type: string };
    return json.type;
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

  describe('problem type classification', () => {
    it('classifies a missing required property', async () => {
      const app = createApp([schemaV2], schemaV2.path);

      await expect(problemType(app, { level: 5 })).resolves.toBe(
        '/problems/validation/missing-property',
      );
    });

    it('classifies a property of the wrong type', async () => {
      const app = createApp([schemaV2], schemaV2.path);

      await expect(problemType(app, { name: 42, level: 5 })).resolves.toBe(
        '/problems/validation/invalid-type',
      );
    });

    it('classifies a property outside its permitted range', async () => {
      const app = createApp([schemaV2], schemaV2.path);

      await expect(problemType(app, { name: 'test', level: 99 })).resolves.toBe(
        '/problems/validation/out-of-range',
      );
    });

    it('classifies an unexpected property', async () => {
      const app = createApp([schemaV1], schemaV1.path);

      await expect(problemType(app, { name: 'test', extra: true })).resolves.toBe(
        '/problems/validation/additional-properties',
      );
    });

    it('widens to the parent type when failures span categories', async () => {
      const app = createApp([schemaV2], schemaV2.path);

      await expect(problemType(app, { level: 99, extra: true })).resolves.toBe(
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
