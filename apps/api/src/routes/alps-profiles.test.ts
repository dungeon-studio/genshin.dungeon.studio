// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it } from 'vitest';

import { app } from '@/app.js';
import { alpsRegistry } from '@/profiles/alps/registry.js';

describe('Profile serving routes', () => {
  describe('GET known profile', () => {
    let res: Response;

    beforeEach(async () => {
      res = await app.request('http://localhost/profiles/alps/character/item-v1.json');
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns application/alps+json content type', () => {
      expect(res.headers.get('content-type')).toBe('application/alps+json');
    });

    it('returns valid ALPS document', async () => {
      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toHaveProperty('alps');
    });
  });

  it('serves every registered profile', async () => {
    for (const entry of alpsRegistry) {
      const res = await app.request(`http://localhost${entry.path}`);
      expect(res.status).toBe(200);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body).toHaveProperty('alps');
    }
  });

  it('returns 404 for unknown profile', async () => {
    const res = await app.request('/profiles/alps/unknown/item-v1.json');
    expect(res.status).toBe(404);
  });
});
