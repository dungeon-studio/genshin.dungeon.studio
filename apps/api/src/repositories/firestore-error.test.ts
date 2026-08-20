// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleError, Status } from 'google-gax';
import { describe, expect, it } from 'vitest';

import { firestoreErrorToHttpException } from './firestore-error.js';

// The emulator cannot be made to exhaust a quota or go unavailable on demand,
// so the transient codes arrive here as constructed errors rather than through
// the integration suite.
function googleError(code?: Status): GoogleError {
  const err = new GoogleError('firestore said no');
  err.code = code;
  return err;
}

describe('firestoreErrorToHttpException', () => {
  it('lets a client retry an exhausted quota', () => {
    expect(firestoreErrorToHttpException(googleError(Status.RESOURCE_EXHAUSTED)).status).toBe(429);
  });

  it('lets a client retry an unavailable backend', () => {
    expect(firestoreErrorToHttpException(googleError(Status.UNAVAILABLE)).status).toBe(503);
  });

  it.each([
    ['a permanent failure', Status.PERMISSION_DENIED],
    ['an error carrying no code', undefined],
  ])('reports %s as an internal error', (_label, code) => {
    expect(firestoreErrorToHttpException(googleError(code)).status).toBe(500);
  });

  it('says nothing about the underlying failure in the response', () => {
    expect(
      firestoreErrorToHttpException(googleError(Status.PERMISSION_DENIED)).message,
    ).not.toMatch(/firestore said no/);
  });
});
