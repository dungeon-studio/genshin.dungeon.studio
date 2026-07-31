// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleError, Status } from 'google-gax';
import { HTTPException } from 'hono/http-exception';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { app } from './app.js';

function googleError(code: Status): GoogleError {
  const err = new GoogleError('firestore blew up');
  err.code = code;
  return err;
}

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  app.get('/__test/resource-exhausted', () => {
    throw googleError(Status.RESOURCE_EXHAUSTED);
  });
  app.get('/__test/unavailable', () => {
    throw googleError(Status.UNAVAILABLE);
  });
  app.get('/__test/permission-denied', () => {
    throw googleError(Status.PERMISSION_DENIED);
  });
  app.get('/__test/http-exception', () => {
    throw new HTTPException(503, { message: 'service unavailable' });
  });
});

describe('onError Retry-After header', () => {
  it('sets Retry-After on a 429 from a Firestore error', async () => {
    const res = await app.request('/__test/resource-exhausted');
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('sets Retry-After on a 503 from a Firestore error', async () => {
    const res = await app.request('/__test/unavailable');
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('5');
  });

  it('omits Retry-After on a non-retryable Firestore error', async () => {
    const res = await app.request('/__test/permission-denied');
    expect(res.status).toBe(500);
    expect(res.headers.get('Retry-After')).toBeNull();
  });

  it('sets Retry-After on a retryable status regardless of source', async () => {
    const res = await app.request('/__test/http-exception');
    expect(res.status).toBe(503);
    expect(res.headers.get('Retry-After')).toBe('5');
  });
});
