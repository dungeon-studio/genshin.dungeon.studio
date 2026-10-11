// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GrpcStatus as Status } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';

import { firestoreError } from '@/test/firestore-error.js';

import { isFirestoreError, toHttpException } from './error.js';

describe('isFirestoreError', () => {
  it.each([
    ['a Node.js system error', Object.assign(new Error('no such file'), { code: 'ENOENT' })],
    ['an error carrying no code', new Error('something broke')],
    ['a bare object carrying a code', { code: Status.UNAVAILABLE }],
  ])('rejects %s', (_label, err) => {
    expect(isFirestoreError(err)).toBe(false);
  });
});

describe('toHttpException', () => {
  it('lets a client retry an exhausted quota', () => {
    expect(toHttpException(firestoreError(Status.RESOURCE_EXHAUSTED)).status).toBe(429);
  });

  it('lets a client retry an unavailable backend', () => {
    expect(toHttpException(firestoreError(Status.UNAVAILABLE)).status).toBe(503);
  });

  it('reports a permanent failure as an internal error', () => {
    expect(toHttpException(firestoreError(Status.PERMISSION_DENIED)).status).toBe(500);
  });

  it('says nothing about the underlying failure in the response', () => {
    expect(toHttpException(firestoreError(Status.PERMISSION_DENIED)).message).not.toMatch(
      /firestore said no/,
    );
  });
});
