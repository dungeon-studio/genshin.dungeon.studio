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

// Fallback backoff, in seconds, when the error carries no RetryInfo hint. Only
// the transient statuses in GRPC_TO_HTTP are retryable; other statuses get no
// Retry-After. Quota exhaustion (429) needs a wider window to recover than a
// momentarily unavailable backend (503).
const RETRY_AFTER_DEFAULT_SECONDS: Partial<Record<ContentfulStatusCode, number>> = {
  429: 30,
  503: 5,
};

// google.rpc.RetryInfo, decoded into `GoogleError.statusDetails` when the
// backend supplies it. `retryDelay` is a protobuf Duration; `seconds` decodes
// as a Long, number, or string depending on runtime configuration.
interface RetryInfoLike {
  retryDelay?: {
    seconds?: number | string | { toNumber: () => number };
    nanos?: number;
  };
}

export function firestoreErrorToHttpException(err: GoogleError): HTTPException {
  const httpStatus = (err.code !== undefined && GRPC_TO_HTTP[err.code]) || 500;
  const label = err.code !== undefined ? (Status[err.code] ?? String(err.code)) : '(unknown)';
  console.error(`Firestore error [gRPC ${label}]:`, err.message);
  return new HTTPException(httpStatus, { message: 'An unexpected error occurred' });
}

// Seconds a client should wait before retrying, for the RFC 9110 Retry-After
// header. Returns undefined for statuses that aren't retryable. Prefers a
// backoff hint forwarded from the backend's RetryInfo, else a per-status
// default.
export function retryAfterSeconds(
  err: GoogleError,
  httpStatus: ContentfulStatusCode,
): number | undefined {
  const fallback = RETRY_AFTER_DEFAULT_SECONDS[httpStatus];
  if (fallback === undefined) return undefined;
  return retryDelayHint(err) ?? fallback;
}

function retryDelayHint(err: GoogleError): number | undefined {
  if (!Array.isArray(err.statusDetails)) return undefined;
  for (const detail of err.statusDetails) {
    const retryDelay = (detail as unknown as RetryInfoLike).retryDelay;
    if (retryDelay === undefined) continue;
    const seconds = durationSeconds(retryDelay.seconds);
    if (seconds === undefined) continue;
    // Retry-After is an integer count of seconds; round any sub-second
    // remainder up so clients never retry before the hint elapses.
    return Math.max(0, Math.ceil(seconds + (retryDelay.nanos ?? 0) / 1e9));
  }
  return undefined;
}

function durationSeconds(
  seconds: number | string | { toNumber: () => number } | undefined,
): number | undefined {
  if (seconds === undefined) return undefined;
  if (typeof seconds === 'number') return Number.isFinite(seconds) ? seconds : undefined;
  if (typeof seconds === 'string') {
    const parsed = Number(seconds);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return seconds.toNumber();
}
