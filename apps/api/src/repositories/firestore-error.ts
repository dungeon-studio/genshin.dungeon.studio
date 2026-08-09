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

function httpStatusFor(code: Status | undefined): ContentfulStatusCode {
  if (code === undefined) return 500;
  return GRPC_TO_HTTP[code] ?? 500;
}

function labelFor(code: Status | undefined): string {
  if (code === undefined) return '(unknown)';
  // A numeric enum's reverse mapping is typed `string`, but yields `undefined`
  // for codes the installed google-gax does not know.
  return Status[code] ?? String(code);
}

export function firestoreErrorToHttpException(err: GoogleError): HTTPException {
  console.error(`Firestore error [gRPC ${labelFor(err.code)}]:`, err.message);
  return new HTTPException(httpStatusFor(err.code), {
    message: 'An unexpected error occurred',
  });
}
