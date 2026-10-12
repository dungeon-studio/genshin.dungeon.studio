// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GrpcStatus } from 'firebase-admin/firestore';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { logger } from '@/logger.js';
import { firestoreError } from '@/test/firestore-error.js';

import { isFirestoreError, toHttpException } from './error.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('isFirestoreError', () => {
  it.each([
    ['a Node.js system error', Object.assign(new Error('no such file'), { code: 'ENOENT' })],
    ['an error carrying no code', new Error('something broke')],
    ['a bare object carrying a code', { code: GrpcStatus.UNAVAILABLE }],
  ])('rejects %s', (_label, err) => {
    expect(isFirestoreError(err)).toBe(false);
  });
});

describe('toHttpException', () => {
  it('lets a client retry an exhausted quota', () => {
    expect(toHttpException(firestoreError(GrpcStatus.RESOURCE_EXHAUSTED)).status).toBe(429);
  });

  it('lets a client retry an unavailable backend', () => {
    expect(toHttpException(firestoreError(GrpcStatus.UNAVAILABLE)).status).toBe(503);
  });

  it('reports a permanent failure as an internal error', () => {
    expect(toHttpException(firestoreError(GrpcStatus.PERMISSION_DENIED)).status).toBe(500);
  });

  it('says nothing about the underlying failure in the response', () => {
    const err = firestoreError(GrpcStatus.PERMISSION_DENIED);
    expect(toHttpException(err).message).not.toContain(err.message);
  });

  it.each([
    ['by name when gRPC defines it', GrpcStatus.UNAVAILABLE, 'UNAVAILABLE'],
    ['by number when gRPC does not', 99 as GrpcStatus, '99'],
  ])('logs the code %s', (_label, code, logged) => {
    const error = vi.spyOn(logger, 'error');
    toHttpException(firestoreError(code));
    expect(error).toHaveBeenCalledWith(
      expect.objectContaining({ grpcCode: logged }),
      expect.anything(),
    );
  });
});
