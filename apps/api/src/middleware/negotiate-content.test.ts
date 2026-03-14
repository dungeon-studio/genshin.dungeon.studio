// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { NegotiatedContentVariables, SupportedRepresentation } from './negotiate-content.js';
import { negotiateContent, toMediaTypeString } from './negotiate-content.js';

const ORIGIN = 'http://localhost';

const jsonWithProfile: SupportedRepresentation = {
  mediaType: 'application/json',
  profilePath: '/schemas/profile/get/1.0.0.json',
};

const jsonWithoutProfile: SupportedRepresentation = {
  mediaType: 'application/json',
};

describe('toMediaTypeString', () => {
  it('returns bare media type when no profilePath is set', () => {
    expect(toMediaTypeString(jsonWithoutProfile, ORIGIN)).toBe('application/json');
  });

  it('appends profile parameter with absolute URI', () => {
    expect(toMediaTypeString(jsonWithProfile, ORIGIN)).toBe(
      'application/json; profile="http://localhost/schemas/profile/get/1.0.0.json"',
    );
  });

  it('uses the provided origin in the profile URI', () => {
    expect(toMediaTypeString(jsonWithProfile, 'https://api.example.com')).toBe(
      'application/json; profile="https://api.example.com/schemas/profile/get/1.0.0.json"',
    );
  });
});

describe('negotiateContent middleware', () => {
  const supported: SupportedRepresentation[] = [
    { mediaType: 'application/json', profilePath: '/schemas/test/1.0.0.json' },
  ];

  function createApp() {
    const app = new Hono<{ Variables: NegotiatedContentVariables }>();
    app.use('*', negotiateContent(supported));
    app.get('/', (c) => c.body(null, 200, { 'Content-Type': c.get('negotiatedMediaType') }));
    return app;
  }

  it('sets negotiatedMediaType when Accept matches', async () => {
    const res = await createApp().request(
      new Request('http://localhost/', { headers: { Accept: 'application/json' } }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/json; profile="http://localhost/schemas/test/1.0.0.json"',
    );
  });

  it('defaults to first representation when no Accept header is provided', async () => {
    const res = await createApp().request('http://localhost/');

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe(
      'application/json; profile="http://localhost/schemas/test/1.0.0.json"',
    );
  });

  it('returns 406 when no supported representation matches', async () => {
    const res = await createApp().request(
      new Request('http://localhost/', { headers: { Accept: 'text/html' } }),
    );

    expect(res.status).toBe(406);
  });
});
