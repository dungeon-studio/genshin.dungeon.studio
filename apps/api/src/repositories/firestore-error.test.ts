// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleError, Status } from 'google-gax';
import { describe, expect, it, vi } from 'vitest';

import { firestoreErrorToHttpException, retryAfterSeconds } from './firestore-error.js';

function googleError(code: Status): GoogleError {
  const err = new GoogleError('firestore blew up');
  err.code = code;
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
  it('returns a wider window for 429 than 503', () => {
    const exhausted = retryAfterSeconds(429);
    const unavailable = retryAfterSeconds(503);
    expect(exhausted).toBeGreaterThan(unavailable as number);
  });

  it('returns a value for each retryable status', () => {
    expect(retryAfterSeconds(429)).toBe(30);
    expect(retryAfterSeconds(503)).toBe(5);
  });

  it('returns undefined for non-retryable statuses', () => {
    expect(retryAfterSeconds(500)).toBeUndefined();
  });
});
