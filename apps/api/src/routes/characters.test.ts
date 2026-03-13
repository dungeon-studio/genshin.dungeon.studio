// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter } from '@genshin/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/auth', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/repositories/characters', () => ({
  listCharacters: vi.fn(),
  getCharacter: vi.fn(),
  saveCharacter: vi.fn(),
  deleteCharacter: vi.fn(),
}));

vi.mock('@genshin/game-data', () => ({
  getCharacterById: vi.fn(),
}));

import { app } from '@/app';
import { verifyToken } from '@/lib/firebase/auth';
import {
  deleteCharacter,
  getCharacter,
  listCharacters,
  saveCharacter,
} from '@/repositories/characters';
import { getCharacterById } from '@genshin/game-data';
import { MAX_CONSTELLATION_LEVEL, MIN_CONSTELLATION_LEVEL } from '@genshin/types';

const FAKE_UID = 'test-user-123';
const FAKE_TOKEN = { uid: FAKE_UID } as Awaited<ReturnType<typeof verifyToken>>;

const FAKE_CHARACTER: CollectionCharacter = {
  characterId: 'albedo',
  constellationLevel: 2,
  createdAt: '2026-01-01T00:00:00.000Z' as CollectionCharacter['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as CollectionCharacter['updatedAt'],
};

function authedRequest(method: string, path: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: { Authorization: 'Bearer valid-token' },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
  }

  return new Request(`http://localhost${path}`, init);
}

describe('Character routes', () => {
  beforeEach(() => {
    vi.mocked(verifyToken).mockResolvedValue(FAKE_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await app.request('/api/characters');

      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed Authorization header', async () => {
      const res = await app.request('/api/characters', {
        headers: { Authorization: 'NotBearer token' },
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/characters', () => {
    it('returns 200 with character list', async () => {
      vi.mocked(listCharacters).mockResolvedValue([FAKE_CHARACTER]);

      const res = await app.request(authedRequest('GET', '/api/characters'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([FAKE_CHARACTER]);
    });

    it('returns 200 with empty list when no characters', async () => {
      vi.mocked(listCharacters).mockResolvedValue([]);

      const res = await app.request(authedRequest('GET', '/api/characters'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe('GET /api/characters/:characterId', () => {
    it('returns 200 with character', async () => {
      vi.mocked(getCharacter).mockResolvedValue(FAKE_CHARACTER);

      const res = await app.request(authedRequest('GET', '/api/characters/albedo'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(FAKE_CHARACTER);
    });

    it('returns 404 when character not in collection', async () => {
      vi.mocked(getCharacter).mockResolvedValue(null);

      const res = await app.request(authedRequest('GET', '/api/characters/albedo'));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Character not found in collection');
    });
  });

  describe('PUT /api/characters/:characterId', () => {
    beforeEach(() => {
      vi.mocked(getCharacterById).mockReturnValue({
        id: 'albedo',
        name: 'Albedo',
      } as ReturnType<typeof getCharacterById>);
    });

    it('returns 201 when character is newly added', async () => {
      vi.mocked(saveCharacter).mockResolvedValue({
        character: FAKE_CHARACTER,
        created: true,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2 }),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual(FAKE_CHARACTER);
    });

    it('returns 200 when character is updated', async () => {
      vi.mocked(saveCharacter).mockResolvedValue({
        character: FAKE_CHARACTER,
        created: false,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2 }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(FAKE_CHARACTER);
    });

    it('returns 400 for unknown character ID', async () => {
      vi.mocked(getCharacterById).mockReturnValue(undefined);

      const res = await app.request(
        authedRequest('PUT', '/api/characters/not-a-character', { constellationLevel: 0 }),
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown character: not-a-character');
    });

    it('returns 400 when body is not valid JSON', async () => {
      const res = await app.request(
        new Request('http://localhost/api/characters/albedo', {
          method: 'PUT',
          headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
          body: 'not-json',
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when constellationLevel is missing', async () => {
      const res = await app.request(authedRequest('PUT', '/api/characters/albedo', {}));

      expect(res.status).toBe(400);
    });

    it('returns 400 when constellationLevel is not a number', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 'high' }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when constellationLevel is below minimum', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', {
          constellationLevel: MIN_CONSTELLATION_LEVEL - 1,
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when constellationLevel is above maximum', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', {
          constellationLevel: MAX_CONSTELLATION_LEVEL + 1,
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when constellationLevel is not an integer', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2.5 }),
      );

      expect(res.status).toBe(400);
    });

    it('accepts constellationLevel at minimum boundary', async () => {
      vi.mocked(saveCharacter).mockResolvedValue({
        character: { ...FAKE_CHARACTER, constellationLevel: MIN_CONSTELLATION_LEVEL },
        created: true,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', {
          constellationLevel: MIN_CONSTELLATION_LEVEL,
        }),
      );

      expect(res.status).toBe(201);
    });

    it('accepts constellationLevel at maximum boundary', async () => {
      vi.mocked(saveCharacter).mockResolvedValue({
        character: { ...FAKE_CHARACTER, constellationLevel: MAX_CONSTELLATION_LEVEL },
        created: true,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', {
          constellationLevel: MAX_CONSTELLATION_LEVEL,
        }),
      );

      expect(res.status).toBe(201);
    });
  });

  describe('DELETE /api/characters/:characterId', () => {
    it('returns 204 with no body', async () => {
      vi.mocked(deleteCharacter).mockResolvedValue();

      const res = await app.request(authedRequest('DELETE', '/api/characters/albedo'));

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });
  });
});
