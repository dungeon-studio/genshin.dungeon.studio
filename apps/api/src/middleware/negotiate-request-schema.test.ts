// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ProfileLink } from '@/middleware/profile-link.js';
import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';

import type { NegotiatedRequestSchemaVariables } from './negotiate-request-schema.js';
import { negotiateRequestSchema } from './negotiate-request-schema.js';

const profileV1: ProfileLink = { path: '/profiles/json-schema/test/put-request-v1.json' };
const profileV2: ProfileLink = { path: '/profiles/json-schema/test/put-request-v2.json' };

describe('negotiateRequestSchema middleware', () => {
  function createApp(profiles: ProfileLink[] = [profileV1]) {
    const app = new Hono<{ Variables: NegotiatedRequestSchemaVariables }>();
    app.put('/test', negotiateRequestSchema(profiles), (c) => {
      return c.json({ negotiatedSchema: c.get('negotiatedSchema') }, 200);
    });
    return app;
  }

  function putRequest(contentType = 'application/json') {
    return new Request('http://localhost/test', {
      method: 'PUT',
      headers: { 'Content-Type': contentType },
      body: '{}',
    });
  }

  it('defaults to first profile when no profile parameter', async () => {
    const app = createApp([profileV2, profileV1]);
    const res = await app.request(putRequest());

    expect(res.status).toBe(200);
    const json = (await res.json()) as { negotiatedSchema: string };
    expect(json.negotiatedSchema).toBe(profileV2.path);
  });

  it('selects v1 when v1 profile URL is specified', async () => {
    const app = createApp([profileV2, profileV1]);
    const profileUrl = 'http://localhost/profiles/json-schema/test/put-request-v1.json';
    const res = await app.request(putRequest(`application/json; profile="${profileUrl}"`));

    expect(res.status).toBe(200);
    const json = (await res.json()) as { negotiatedSchema: string };
    expect(json.negotiatedSchema).toBe(profileV1.path);
  });

  it('selects v1 when profile is an absolute path', async () => {
    const app = createApp([profileV1]);
    const res = await app.request(
      putRequest('application/json; profile="/profiles/json-schema/test/put-request-v1.json"'),
    );

    expect(res.status).toBe(200);
    const json = (await res.json()) as { negotiatedSchema: string };
    expect(json.negotiatedSchema).toBe(profileV1.path);
  });

  it('selects v2 when v2 profile URL is specified', async () => {
    const app = createApp([profileV2, profileV1]);
    const profileUrl = 'http://localhost/profiles/json-schema/test/put-request-v2.json';
    const res = await app.request(putRequest(`application/json; profile="${profileUrl}"`));

    expect(res.status).toBe(200);
    const json = (await res.json()) as { negotiatedSchema: string };
    expect(json.negotiatedSchema).toBe(profileV2.path);
  });

  it('returns 415 for unrecognised profile', async () => {
    const app = createApp([profileV1]);
    const profileUrl = 'http://localhost/profiles/json-schema/test/put-request-v99.json';
    const res = await app.request(putRequest(`application/json; profile="${profileUrl}"`));

    expect(res.status).toBe(415);
  });

  it('returns 415 when client requests v1 but server only supports v2', async () => {
    const app = createApp([profileV2]);
    const profileUrl = 'http://localhost/profiles/json-schema/test/put-request-v1.json';
    const res = await app.request(putRequest(`application/json; profile="${profileUrl}"`));

    expect(res.status).toBe(415);
  });

  it('returns 415 when profile is a bare string that is not a URL or supported path', async () => {
    const app = createApp([profileV1]);
    const res = await app.request(putRequest('application/json; profile="some-unknown-value"'));

    expect(res.status).toBe(415);
  });

  it('throws when constructed with an empty profiles array', () => {
    expect(() => negotiateRequestSchema([])).toThrow(
      'negotiateRequestSchema requires at least one profile',
    );
  });

  it('returns 400 for a malformed Content-Type header', async () => {
    const app = createApp([profileV1]);
    const res = await app.request(putRequest('%%%garbage%%%'));

    expect(res.status).toBe(400);
  });
});
