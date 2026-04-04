// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';
import type { ErrorObject, SchemaObject } from 'ajv/dist/2020.js';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

const ajv = new Ajv2020({ allErrors: true });

export type ValidatedRequestBodyVariables = {
  /** The parsed and validated request body. */
  validatedBody: unknown;
};

/**
 * Request body validation middleware.
 *
 * Reads `negotiatedSchema` from the context (set by `negotiateRequestSchema`),
 * finds the matching schema, parses the JSON request body, and validates it.
 *
 * Sets `validatedBody` on the context.
 */
export function validateRequestBody(schemas: JsonSchemaProfile[]): MiddlewareHandler {
  const entries = schemas.map((s) => ({
    path: s.path,
    validate: ajv.compile(s.schema as SchemaObject),
  }));

  return async (c, next) => {
    const negotiatedPath = c.get('negotiatedSchema') as string | undefined;

    if (!negotiatedPath) {
      throw new Error('validateRequestBody requires negotiateRequestSchema to run first');
    }

    const entry = entries.find((e) => e.path === negotiatedPath);

    if (!entry) {
      throw new Error(`No schema compiled for negotiated path: ${negotiatedPath}`);
    }

    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      throw new HTTPException(400, { message: 'Invalid or missing JSON body' });
    }

    if (!entry.validate(body)) {
      const detail = entry.validate.errors
        ?.map((e: ErrorObject) => {
          const path = e.instancePath || '/';
          return `${path}: ${e.message}`;
        })
        .join('; ');

      throw new HTTPException(422, {
        message: detail ?? 'Request body validation failed',
      });
    }

    c.set('validatedBody', body);
    await next();
  };
}
