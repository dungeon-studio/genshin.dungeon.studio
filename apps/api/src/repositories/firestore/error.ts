// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GrpcStatus as Status } from 'firebase-admin/firestore';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { INTERNAL_ERROR_DETAIL } from '@/http/problem.js';
import { logger } from '@/logger.js';

// Firestore gRPC errors are internal failures from the user's perspective.
// Only transient conditions get non-500 status codes to enable client retry.
const GRPC_TO_HTTP: Partial<Record<Status, ContentfulStatusCode>> = {
  [Status.RESOURCE_EXHAUSTED]: 429,
  [Status.UNAVAILABLE]: 503,
};

function httpStatusFor(code: Status): ContentfulStatusCode {
  return GRPC_TO_HTTP[code] ?? 500;
}

function labelFor(code: Status): string {
  // A numeric enum's reverse mapping is typed `string`, but yields `undefined`
  // for codes Firestore does not know.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return Status[code] ?? String(code);
}

/** A rejection from a Firestore call: an `Error` carrying a gRPC status code. */
export interface FirestoreError extends Error {
  code: Status;
}

/**
 * Whether a thrown value came back from Firestore.
 *
 * Tests the runtime shape, not the class. Firestore rejects with a plain
 * `Error` that has a numeric `code` from gRPC, whereas Node.js system errors
 * and other Firebase errors carry string codes.
 */
export function isFirestoreError(err: unknown): err is FirestoreError {
  return err instanceof Error && 'code' in err && typeof err.code === 'number';
}

/**
 * Turns a Firestore gRPC failure into the response a client should see, and
 * logs what actually happened.
 *
 * The returned detail is deliberately the same for every code: the gRPC status
 * describes our storage layer, and naming it would tell a caller about
 * infrastructure they can't act on. The distinction a caller can act on is the
 * status code, where a transient condition is 429 or 503 and everything else is
 * 500.
 */
export function toHttpException(err: FirestoreError): HTTPException {
  logger.error({ grpcCode: labelFor(err.code), grpcMessage: err.message }, 'firestore call failed');
  return new HTTPException(httpStatusFor(err.code), { message: INTERNAL_ERROR_DETAIL });
}
