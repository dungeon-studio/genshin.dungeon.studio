// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ErrorObject, SchemaObject } from 'ajv/dist/2020.js';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

const ajv = new Ajv2020({ allErrors: true });

export type ValidatedBodyVariables = {
  validatedBody: unknown;
};

/**
 * Hono middleware that validates the JSON request body against a JSON Schema.
 * Stores the parsed body on the context as `validatedBody`.
 * Returns 400 for unparseable JSON, 422 for schema validation failures.
 */
export function validateBody(schema: SchemaObject): MiddlewareHandler {
  const validate = ajv.compile(schema);

  return async (c, next) => {
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      throw new HTTPException(400, { message: 'Invalid or missing JSON body' });
    }

    if (!validate(body)) {
      const detail = validate.errors
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
