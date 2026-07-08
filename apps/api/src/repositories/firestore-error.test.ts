// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleError, Status } from 'google-gax';
import { describe, expect, it, vi } from 'vitest';

import { firestoreErrorToHttpException, retryAfterSeconds } from './firestore-error.js';

function googleError(code: Status, statusDetails?: unknown[]): GoogleError {
  const err = new GoogleError('firestore blew up');
  err.code = code;
  if (statusDetails !== undefined)
    err.statusDetails = statusDetails as GoogleError['statusDetails'];
  return err;
}

describe('firestoreErrorToHttpException', () => {
  it('maps RESOURCE_EXHAUSTED to 429', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(firestoreErrorToHttpException(googleError(Status.RESOURCE_EXHAUSTED)).status).toBe(429);
  });

  it('maps UNAVAILABLE to 503', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(firestoreErrorToHttpException(googleError(Status.UNAVAILABLE)).status).toBe(503);
  });

  it('maps other codes to 500', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(firestoreErrorToHttpException(googleError(Status.PERMISSION_DENIED)).status).toBe(500);
  });
});

describe('retryAfterSeconds', () => {
  it('returns a per-status default for 429 when no hint is present', () => {
    expect(retryAfterSeconds(googleError(Status.RESOURCE_EXHAUSTED), 429)).toBe(30);
  });

  it('returns a per-status default for 503 when no hint is present', () => {
    expect(retryAfterSeconds(googleError(Status.UNAVAILABLE), 503)).toBe(5);
  });

  it('returns undefined for non-retryable statuses', () => {
    expect(retryAfterSeconds(googleError(Status.PERMISSION_DENIED), 500)).toBeUndefined();
  });

  it('forwards a RetryInfo backoff hint when present', () => {
    const err = googleError(Status.RESOURCE_EXHAUSTED, [{ retryDelay: { seconds: 42, nanos: 0 } }]);
    expect(retryAfterSeconds(err, 429)).toBe(42);
  });

  it('rounds a sub-second hint up to the next whole second', () => {
    const err = googleError(Status.UNAVAILABLE, [
      { retryDelay: { seconds: 2, nanos: 500_000_000 } },
    ]);
    expect(retryAfterSeconds(err, 503)).toBe(3);
  });

  it('reads Long-encoded seconds via toNumber', () => {
    const err = googleError(Status.UNAVAILABLE, [
      { retryDelay: { seconds: { toNumber: () => 7 }, nanos: 0 } },
    ]);
    expect(retryAfterSeconds(err, 503)).toBe(7);
  });

  it('falls back to the default when a detail carries no retryDelay', () => {
    const err = googleError(Status.UNAVAILABLE, [{ reason: 'SOMETHING_ELSE' }]);
    expect(retryAfterSeconds(err, 503)).toBe(5);
  });
});
