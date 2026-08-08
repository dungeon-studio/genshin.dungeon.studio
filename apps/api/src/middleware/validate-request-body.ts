// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ErrorObject, SchemaObject } from 'ajv/dist/2020.js';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { ProblemException } from '@/http/problem.js';
import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

const ajv = new Ajv2020({ allErrors: true });

/**
 * Problem type for a validation failure that resists a narrower label, either
 * because the keyword has no category or because the body broke several
 * categories at once and no single one describes the response.
 */
const VALIDATION = '/problems/validation';

// The failure mode a client branches on, keyed by the ajv keyword that
// rejected the body. Keywords absent here fall back to VALIDATION.
const PROBLEM_TYPE_BY_KEYWORD: Record<string, string> = {
  additionalProperties: `${VALIDATION}/additional-properties`,
  exclusiveMaximum: `${VALIDATION}/out-of-range`,
  exclusiveMinimum: `${VALIDATION}/out-of-range`,
  maxItems: `${VALIDATION}/out-of-range`,
  maxLength: `${VALIDATION}/out-of-range`,
  maxProperties: `${VALIDATION}/out-of-range`,
  maximum: `${VALIDATION}/out-of-range`,
  minItems: `${VALIDATION}/out-of-range`,
  minLength: `${VALIDATION}/out-of-range`,
  minProperties: `${VALIDATION}/out-of-range`,
  minimum: `${VALIDATION}/out-of-range`,
  multipleOf: `${VALIDATION}/out-of-range`,
  required: `${VALIDATION}/missing-property`,
  type: `${VALIDATION}/invalid-type`,
  unevaluatedProperties: `${VALIDATION}/additional-properties`,
};

// A response carries one type, so a body failing several categories widens to
// the parent rather than claiming a category that only covers part of it.
function validationProblemType(errors: ErrorObject[]): string {
  const types = new Set(errors.map((e) => PROBLEM_TYPE_BY_KEYWORD[e.keyword] ?? VALIDATION));
  const [only] = types;
  return types.size === 1 && only ? only : VALIDATION;
}

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
      const errors = entry.validate.errors ?? [];
      const detail = errors
        .map((e: ErrorObject) => {
          const path = e.instancePath || '/';
          return `${path}: ${e.message}`;
        })
        .join('; ');

      throw new ProblemException(422, {
        type: validationProblemType(errors),
        message: detail || 'Request body validation failed',
      });
    }

    c.set('validatedBody', body);
    await next();
  };
}
