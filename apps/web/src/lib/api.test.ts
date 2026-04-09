// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
}));

// Must import after the mock is registered
const { ApiError, apiGet, apiPut, apiPost, apiPatch, apiDelete } = await import('./api');

describe('API methods (unauthenticated)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('apiGet sends a GET request and returns parsed JSON', async () => {
    const payload = { name: 'Traveler' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await apiGet('/profiles/me');

    expect(fetch).toHaveBeenCalledOnce();
    expect(result).toEqual(payload);
  });

  it('apiPut sends a PUT request with JSON body', async () => {
    const body = { name: 'Updated' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiPut('/profiles/me', body);

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('PUT');
    expect(init?.body).toBe(JSON.stringify(body));
  });

  it('apiPost sends a POST request with JSON body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: '1' }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiPost('/weapons', { weaponId: 'sword-1' });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('POST');
  });

  it('apiPatch sends a PATCH request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await apiPatch('/weapons/1', { refinementLevel: 3 });

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('PATCH');
  });

  it('apiDelete sends a DELETE request', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }));

    await apiDelete('/teams/1');

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('DELETE');
  });

  it('returns undefined for 204 No Content responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiGet('/some-path');

    expect(result).toBeUndefined();
  });

  it('throws ApiError with problem detail for application/problem+json errors', async () => {
    const problem = {
      type: 'about:blank',
      title: 'Not Found',
      status: 404,
      detail: 'Resource not found',
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(problem), {
        status: 404,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(apiGet('/missing')).rejects.toThrow(ApiError);
    await vi.restoreAllMocks();

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(problem), {
        status: 404,
        headers: { 'Content-Type': 'application/problem+json' },
      }),
    );

    await expect(apiGet('/missing')).rejects.toMatchObject({
      problem: expect.objectContaining({ status: 404, detail: 'Resource not found' }),
    });
  });

  it('throws ApiError with synthesized problem for non-JSON errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Internal Server Error', {
        status: 500,
        statusText: 'Internal Server Error',
      }),
    );

    await expect(apiGet('/broken')).rejects.toThrow(ApiError);
  });
});
