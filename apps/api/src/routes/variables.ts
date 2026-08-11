// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import type { RequestLogVariables } from '@/middleware/log-request.js';
import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';
import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import type { ValidatedRequestBodyVariables } from '@/middleware/validate-request-body.js';

/**
 * What the context carries on a route behind the full middleware stack: signed
 * in, content negotiated in both directions, request body already validated.
 *
 * Hono checks a middleware's declared variables against the app mounting it, so
 * a stack this wide is otherwise restated by every route that runs it — and
 * every new variable means editing all of them.
 */
export type AuthenticatedRouteVariables = AuthVariables &
  NegotiatedResponseContentVariables &
  RequestLogVariables &
  NegotiatedRequestSchemaVariables &
  ValidatedRequestBodyVariables;
