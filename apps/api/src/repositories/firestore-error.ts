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

export function firestoreErrorToHttpException(err: GoogleError): HTTPException {
  const httpStatus = (err.code !== undefined && GRPC_TO_HTTP[err.code]) || 500;
  const label = err.code !== undefined ? (Status[err.code] ?? String(err.code)) : '(unknown)';
  console.error(`Firestore error [gRPC ${label}]:`, err.message);
  return new HTTPException(httpStatus, { message: 'An unexpected error occurred' });
}
