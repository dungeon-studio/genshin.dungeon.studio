// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { app } from '@/app.js';
import rootGetSchema from '@/schemas/root/get/1.0.0.json' with { type: 'json' };
import { Ajv2020 } from 'ajv/dist/2020.js';
import { beforeEach, describe, expect, it } from 'vitest';

const ajv = new Ajv2020();
const validateGetSchema = ajv.compile(rootGetSchema);

const EXPECTED_CONTENT_TYPE =
  'application/json; profile="http://localhost/schemas/root/get/1.0.0.json"';

describe('GET /', () => {
  let res: Response;

  beforeEach(async () => {
    res = await app.request('/');
  });

  it('returns 200 with a response matching the root schema', async () => {
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    const body = await res.json();
    expect(validateGetSchema(body)).toBe(true);
  });

  it('dynamically includes links to registered resources', async () => {
    const body = (await res.json()) as { links: Record<string, { href: string }> };
    expect(body.links).toEqual(
      expect.objectContaining({
        characters: { href: '/api/characters' },
        profile: { href: '/api/profile' },
        weapons: { href: '/api/weapons' },
        health: { href: '/health' },
      }),
    );
  });
});
