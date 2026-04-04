// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { app } from '@/app.js';
import { schemaRegistry } from '@/schemas/registry.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Schema serving routes', () => {
  describe('GET known schema', () => {
    let res: Response;

    beforeEach(async () => {
      res = await app.request('http://localhost/profiles/json-schema/root/get-response-v1.json');
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns application/schema+json content type', () => {
      expect(res.headers.get('content-type')).toBe('application/schema+json');
    });

    it('rewrites $id to match request origin', async () => {
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.$id).toBe('http://localhost/profiles/json-schema/root/get-response-v1.json');
    });

    it('preserves schema fields', async () => {
      const body = (await res.json()) as Record<string, unknown>;
      expect(body.title).toBe('API Root');
      expect(body.type).toBe('object');
    });
  });

  it('serves every registered schema', async () => {
    for (const entry of schemaRegistry) {
      const res = await app.request(`http://localhost${entry.path}`);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body.$id).toBe(`http://localhost${entry.path}`);
    }
  });

  it('returns 404 for unknown schema', async () => {
    const res = await app.request('/profiles/json-schema/unknown/get-response-v1.json');
    expect(res.status).toBe(404);
  });
});
