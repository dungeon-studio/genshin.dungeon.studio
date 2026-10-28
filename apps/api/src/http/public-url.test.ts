// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import { publicUrl } from './public-url.js';

async function protocolFor(url: string, forwardedProto?: string): Promise<string> {
  const app = new Hono();
  app.get('*', (c) => c.text(publicUrl(c).protocol));

  const headers: Record<string, string> =
    forwardedProto === undefined ? {} : { 'X-Forwarded-Proto': forwardedProto };
  const res = await app.request(url, { headers });

  return res.text();
}

describe('publicUrl', () => {
  it('keeps the request scheme without a forwarded one', async () => {
    expect(await protocolFor('http://localhost/x')).toBe('http:');
  });

  it('takes the first hop of a forwarded scheme list', async () => {
    expect(await protocolFor('http://localhost/x', 'https, http')).toBe('https:');
  });

  it('never downgrades an https request', async () => {
    expect(await protocolFor('https://localhost/x', 'http')).toBe('https:');
  });
});
