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

// The web app is a different origin from the API in every deployed
// environment, so the browser reaching it at all depends on this header. A
// request without an `Origin` answers the same however the middleware is
// configured, which is why the header is the whole test.
describe('CORS', () => {
  const origin = 'http://localhost:5173';

  it('allows the configured frontend origin', async () => {
    const res = await app.request('/health', { headers: { Origin: origin } });
    expect(res.headers.get('access-control-allow-origin')).toBe(origin);
  });

  it('withholds the header from any other origin', async () => {
    const res = await app.request('/health', {
      headers: { Origin: 'https://not-the-frontend.example' },
    });
    expect(res.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('allows credentials, so the browser sends the ID token', async () => {
    const res = await app.request('/health', { headers: { Origin: origin } });
    expect(res.headers.get('access-control-allow-credentials')).toBe('true');
  });
});

// The root document advertises resources without method hints, so OPTIONS is
// how a client learns what one supports. These requests carry no credentials
// because a browser preflight carries none either.
describe('Allow header', () => {
  function allowed(res: Response): string[] {
    return (res.headers.get('allow') ?? '').split(',').map((method) => method.trim());
  }

  it.each([
    ['a read-only collection', '/api/characters', ['GET', 'HEAD', 'OPTIONS']],
    ['a writable collection', '/api/weapons', ['GET', 'HEAD', 'OPTIONS', 'POST']],
    [
      'a parameterized item resource',
      '/api/weapons/8c1a9c4e-1c2e-4a3f-9d5b-6f7a8b9c0d1e',
      ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH'],
    ],
    ['the user profile', '/api/profile', ['GET', 'HEAD', 'OPTIONS', 'PATCH']],
  ])('advertises the methods of %s', async (_resource, path, methods) => {
    const res = await app.request(path, { method: 'OPTIONS' });
    expect(allowed(res)).toEqual(methods);
  });

  it('withholds the header where nothing is routed', async () => {
    const res = await app.request('/api/not-a-resource', { method: 'OPTIONS' });
    expect(res.headers.get('allow')).toBeNull();
  });

  it('accompanies the CORS preflight response', async () => {
    const res = await app.request('/api/weapons', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
      },
    });

    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:5173');
    expect(res.headers.get('access-control-allow-methods')).toContain('POST');
    expect(allowed(res)).toContain('POST');
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
