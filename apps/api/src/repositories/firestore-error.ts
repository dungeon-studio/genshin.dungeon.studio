// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { GoogleError } from 'google-gax';
import { Status } from 'google-gax';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { logger } from '@/logger.js';

// Firestore gRPC errors are internal failures from the user's perspective.
// Only transient conditions get non-500 status codes to enable client retry.
const GRPC_TO_HTTP: Partial<Record<Status, ContentfulStatusCode>> = {
  [Status.RESOURCE_EXHAUSTED]: 429,
  [Status.UNAVAILABLE]: 503,
};

function httpStatusFor(code: Status | undefined): ContentfulStatusCode {
  if (code === undefined) return 500;
  return GRPC_TO_HTTP[code] ?? 500;
}

function labelFor(code: Status | undefined): string {
  if (code === undefined) return '(unknown)';
  // A numeric enum's reverse mapping is typed `string`, but yields `undefined`
  // for codes google-gax does not know.
  return Status[code] ?? String(code);
}

/**
 * Turns a Firestore gRPC failure into the response a client should see, and
 * logs what actually happened.
 *
 * The returned message is deliberately the same for every code: the gRPC status
 * describes our storage layer, and naming it would tell a caller about
 * infrastructure they can't act on. The distinction a caller can act on is the
 * status code, where a transient condition is 429 or 503 and everything else is
 * 500.
 */
export function firestoreErrorToHttpException(err: GoogleError): HTTPException {
  logger.error({ grpcCode: labelFor(err.code), grpcMessage: err.message }, 'firestore call failed');
  return new HTTPException(httpStatusFor(err.code), {
    message: 'An unexpected error occurred',
  });
}
