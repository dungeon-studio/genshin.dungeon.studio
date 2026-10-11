// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GrpcStatus } from 'firebase-admin/firestore';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as LoggerModule from '@/logger.js';
import { firestoreError } from '@/test/firestore-error.js';

const lines: string[] = [];

vi.mock('@/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoggerModule>();
  return {
    ...actual,
    logger: actual.createLogger({
      level: 'error',
      destination: { write: (line: string) => lines.push(line) },
    }),
  };
});

const { isFirestoreError, toHttpException } = await import('./error.js');

beforeEach(() => {
  lines.length = 0;
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
    toHttpException(firestoreError(code));
    expect(lines.map((line) => JSON.parse(line) as unknown)).toEqual([
      expect.objectContaining({ grpcCode: logged }),
    ]);
  });
});
