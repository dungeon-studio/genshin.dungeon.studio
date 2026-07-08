// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { GoogleError } from 'google-gax';
import { Status } from 'google-gax';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Firestore gRPC errors are internal failures from the user's perspective.
// Only transient conditions get non-500 status codes to enable client retry.
const GRPC_TO_HTTP: Partial<Record<Status, ContentfulStatusCode>> = {
  [Status.RESOURCE_EXHAUSTED]: 429,
  [Status.UNAVAILABLE]: 503,
};

// Seconds a client should wait before retrying each transient status, for the
// RFC 9110 Retry-After header. Quota exhaustion (429) needs a wider window to
// recover than a momentarily unavailable service (503). Statuses absent here
// aren't retryable and get no Retry-After.
const RETRY_AFTER_SECONDS: Partial<Record<ContentfulStatusCode, number>> = {
  429: 30,
  503: 5,
};

export function firestoreErrorToHttpException(err: GoogleError): HTTPException {
  const httpStatus = (err.code !== undefined && GRPC_TO_HTTP[err.code]) || 500;
  const label = err.code !== undefined ? (Status[err.code] ?? String(err.code)) : '(unknown)';
  console.error(`Firestore error [gRPC ${label}]:`, err.message);
  return new HTTPException(httpStatus, { message: 'An unexpected error occurred' });
}

// Seconds a client should wait before retrying, or undefined for statuses that
// aren't retryable.
export function retryAfterSeconds(httpStatus: ContentfulStatusCode): number | undefined {
  return RETRY_AFTER_SECONDS[httpStatus];
}
