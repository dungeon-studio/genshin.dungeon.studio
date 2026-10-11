// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GrpcStatus } from 'firebase-admin/firestore';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

import { INTERNAL_ERROR_DETAIL } from '@/http/problem.js';
import { logger } from '@/logger.js';

// Firestore gRPC errors are internal failures from the user's perspective.
// Only transient conditions get non-500 status codes to enable client retry.
const GRPC_TO_HTTP: Partial<Record<GrpcStatus, ContentfulStatusCode>> = {
  [GrpcStatus.RESOURCE_EXHAUSTED]: 429,
  [GrpcStatus.UNAVAILABLE]: 503,
};

function labelFor(code: GrpcStatus): string {
  // A numeric enum's reverse mapping is typed `string`, but yields `undefined`
  // for codes Firestore does not know.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return GrpcStatus[code] ?? String(code);
}

export interface FirestoreError extends Error {
  code: GrpcStatus;
}

/**
 * Whether a thrown value came back from Firestore.
 *
 * Firestore rejects with a plain `Error` carrying a numeric gRPC `code`.
 * Node.js system errors and other Firebase errors carry string codes.
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
  return new HTTPException(GRPC_TO_HTTP[err.code] ?? 500, { message: INTERNAL_ERROR_DETAIL });
}
