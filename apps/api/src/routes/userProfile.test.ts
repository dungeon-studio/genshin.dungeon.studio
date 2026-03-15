// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import profileGetSchema from '@/schemas/profile/get/1.0.0.json' with { type: 'json' };
import type { UserProfile } from '@genshin/types';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/auth.js', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/repositories/profile/index.js', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
}));

import { app } from '@/app.js';
import { verifyToken } from '@/lib/firebase/auth.js';
import { getProfile, updateProfile } from '@/repositories/profile/index.js';
import { FAKE_UID, authedRequest } from '@/test/auth-requests.js';

const ajv = new Ajv2020();
const validateGetSchema = ajv.compile(profileGetSchema);

const EXPECTED_CONTENT_TYPE =
  'application/json; profile="http://localhost/schemas/profile/get/1.0.0.json"';

const FAKE_PROFILE_TOKEN = {
  uid: FAKE_UID,
  aud: 'test-project',
  auth_time: 0,
  exp: 0,
  iat: 0,
  iss: 'https://securetoken.google.com/test-project',
  sub: FAKE_UID,
  email: 'traveler@example.com',
  email_verified: true,
  firebase: {
    sign_in_provider: 'google.com',
    identities: { 'google.com': ['google-uid-123'] },
  },
} as Awaited<ReturnType<typeof verifyToken>>;

const FAKE_PROFILE: UserProfile = {
  name: 'Traveler',
  createdAt: '2026-01-01T00:00:00.000Z' as UserProfile['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as UserProfile['updatedAt'],
};

describe('Profile routes', () => {
  beforeEach(() => {
    vi.mocked(verifyToken).mockResolvedValue(FAKE_PROFILE_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await app.request('/api/profile');

      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed Authorization header', async () => {
      const res = await app.request('/api/profile', {
        headers: { Authorization: 'NotBearer token' },
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is expired', async () => {
      vi.mocked(verifyToken).mockRejectedValue({ code: 'auth/id-token-expired' });

      const res = await app.request(authedRequest('GET', '/api/profile'));

      expect(res.status).toBe(401);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Invalid or expired token');
    });
  });

  describe('GET /api/profile', () => {
    it('returns 200 with a response matching the profile schema', async () => {
      vi.mocked(getProfile).mockResolvedValue(FAKE_PROFILE);

      const res = await app.request(authedRequest('GET', '/api/profile'));

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
      const body = await res.json();
      expect(validateGetSchema(body)).toBe(true);
      expect((body as Record<string, unknown>).name).toBe('Traveler');
    });

    it('returns 404 when profile does not exist', async () => {
      vi.mocked(getProfile).mockResolvedValue(null);

      const res = await app.request(authedRequest('GET', '/api/profile'));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Profile not found');
    });

    it('returns 500 when repository throws', async () => {
      vi.mocked(getProfile).mockRejectedValue(new Error('Firestore unavailable'));

      const res = await app.request(authedRequest('GET', '/api/profile'));

      expect(res.status).toBe(500);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('An unexpected error occurred');
    });
  });

  describe('PATCH /api/profile', () => {
    it('returns 200 with a response matching the profile schema', async () => {
      const updated = { ...FAKE_PROFILE, name: 'Aether' };
      vi.mocked(updateProfile).mockResolvedValue(updated);

      const res = await app.request(authedRequest('PATCH', '/api/profile', { name: 'Aether' }));

      expect(res.status).toBe(200);
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
      const body = await res.json();
      expect(validateGetSchema(body)).toBe(true);
      expect((body as Record<string, unknown>).name).toBe('Aether');
    });

    it('rejects empty body', async () => {
      const res = await app.request(authedRequest('PATCH', '/api/profile', {}));

      expect(res.status).toBe(422);
    });

    it('rejects auth-managed fields', async () => {
      const res = await app.request(
        authedRequest('PATCH', '/api/profile', { email: 'hacked@example.com' }),
      );

      expect(res.status).toBe(422);
    });

    it('rejects system-managed fields', async () => {
      const res = await app.request(
        authedRequest('PATCH', '/api/profile', { createdAt: '2020-01-01T00:00:00.000Z' }),
      );

      expect(res.status).toBe(422);
    });

    it('rejects unknown fields', async () => {
      const res = await app.request(
        authedRequest('PATCH', '/api/profile', { name: 'Aether', role: 'admin' }),
      );

      expect(res.status).toBe(422);
    });

    it('rejects request without JSON body', async () => {
      const res = await app.request(
        new Request('http://localhost/api/profile', {
          method: 'PATCH',
          headers: { Authorization: 'Bearer valid-token' },
        }),
      );

      expect(res.status).toBe(400);
    });
  });
});
