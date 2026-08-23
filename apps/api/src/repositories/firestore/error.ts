// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleError, Status } from 'google-gax';
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
 * Whether a thrown value came back from Firestore.
 *
 * False for every real rejection: two copies of google-gax resolve, so the
 * class tested here is never the class the rejection was built from. #1427
 * tracks the fix.
 */
export function isFirestoreError(err: unknown): err is GoogleError {
  return err instanceof GoogleError;
}

export function toHttpException(err: GoogleError): HTTPException {
  logger.error({ grpcCode: labelFor(err.code), grpcMessage: err.message }, 'firestore call failed');
  return new HTTPException(httpStatusFor(err.code), { message: INTERNAL_ERROR_DETAIL });
}
