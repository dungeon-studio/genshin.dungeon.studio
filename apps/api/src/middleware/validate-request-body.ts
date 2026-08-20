// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ErrorObject, SchemaObject } from 'ajv/dist/2020.js';
import { Ajv2020 } from 'ajv/dist/2020.js';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { ProblemOptions } from '@/http/problem.js';
import { ProblemException } from '@/http/problem.js';
import type { JsonSchemaProfile } from '@/profiles/json-schema/json-schema-profile.js';

const ajv = new Ajv2020({ allErrors: true });

/** Parent type for a validation failure carrying no narrower classification. */
const VALIDATION = '/problems/validation';
const MISSING_PROPERTY = `${VALIDATION}/missing-property`;
const INVALID_TYPE = `${VALIDATION}/invalid-type`;
const OUT_OF_RANGE = `${VALIDATION}/out-of-range`;
const ADDITIONAL_PROPERTIES = `${VALIDATION}/additional-properties`;

// The failure mode a client branches on, keyed by the ajv keyword that
// rejected the body.
const PROBLEM_TYPE_BY_KEYWORD: Record<string, string> = {
  additionalProperties: ADDITIONAL_PROPERTIES,
  exclusiveMaximum: OUT_OF_RANGE,
  exclusiveMinimum: OUT_OF_RANGE,
  maxItems: OUT_OF_RANGE,
  maxLength: OUT_OF_RANGE,
  maxProperties: OUT_OF_RANGE,
  maximum: OUT_OF_RANGE,
  minItems: OUT_OF_RANGE,
  minLength: OUT_OF_RANGE,
  minProperties: OUT_OF_RANGE,
  minimum: OUT_OF_RANGE,
  multipleOf: OUT_OF_RANGE,
  required: MISSING_PROPERTY,
  type: INVALID_TYPE,
  unevaluatedProperties: ADDITIONAL_PROPERTIES,
};

function validationProblem(errors: ErrorObject[]): ProblemOptions {
  const types = new Set(errors.map((e) => PROBLEM_TYPE_BY_KEYWORD[e.keyword] ?? VALIDATION));
  const [only] = types;
  // A response carries one type, so a body failing several categories widens to
  // the parent rather than claiming one that covers only part of it.
  const type = types.size === 1 && only ? only : VALIDATION;

  const detail = errors.map((e) => `${e.instancePath || '/'}: ${e.message}`).join('; ');

  return { type, message: detail || 'Request body validation failed' };
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
      throw new ProblemException(422, validationProblem(entry.validate.errors ?? []));
    }

    c.set('validatedBody', body);
    await next();
  };
}
