// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { COLLECTION_JSON, type CollectionDocument } from '@genshin/collection-json';
import type { CollectionCharacter } from '@genshin/domain';
import { MAX_CONSTELLATION_LEVEL, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { app } from '@/app.js';
import { verifyToken } from '@/lib/firebase/auth.js';
import { toMediaTypeString } from '@/middleware/negotiate-content.js';
import { characterItemV1 } from '@/profiles/alps/character/item-v1.js';
import * as Characters from '@/repositories/characters/index.js';
import { FAKE_TOKEN, authedRequest } from '@/test/auth-requests.js';

vi.mock('@/lib/firebase/auth.js', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/repositories/characters/index.js', () => ({
  list: vi.fn(),
  get: vi.fn(),
  save: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@genshin/game-data', () => ({
  getCharacterById: vi.fn(),
}));

const FAKE_CHARACTER: CollectionCharacter = {
  characterId: 'albedo',
  constellationLevel: 2,
  createdAt: '2026-01-01T00:00:00.000Z' as CollectionCharacter['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as CollectionCharacter['updatedAt'],
};

const EXPECTED_CONTENT_TYPE = toMediaTypeString(
  { mediaType: COLLECTION_JSON, profile: characterItemV1 },
  'http://localhost',
);

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

    it('returns 401 when token is expired', async () => {
      vi.mocked(verifyToken).mockRejectedValue({ code: 'auth/id-token-expired' });

      const res = await app.request(authedRequest('GET', '/api/characters'));

      expect(res.status).toBe(401);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Invalid or expired token');
    });
  });

  describe('GET /api/characters', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(Characters.list).mockResolvedValue([FAKE_CHARACTER]);
      res = await app.request(authedRequest('GET', '/api/characters'));
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    });

    it('returns one item per character', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes character domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'characterId', value: 'albedo' }),
          expect.objectContaining({ name: 'constellationLevel', value: 2 }),
        ]),
      );
    });

    it('returns empty items when no characters exist', async () => {
      vi.mocked(Characters.list).mockResolvedValue([]);

      const res = await app.request(authedRequest('GET', '/api/characters'));

      const body = (await res.json()) as CollectionDocument;
      expect(body.collection.items).toEqual([]);
    });

    it('returns 500 when repository throws', async () => {
      vi.mocked(Characters.list).mockRejectedValue(new Error('Firestore unavailable'));

      const res = await app.request(authedRequest('GET', '/api/characters'));

      expect(res.status).toBe(500);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('An unexpected error occurred');
    });
  });

  describe('GET /api/characters/:characterId', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(Characters.get).mockResolvedValue(FAKE_CHARACTER);
      res = await app.request(authedRequest('GET', '/api/characters/albedo'));
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    });

    it('returns single-item collection', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes character domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'characterId', value: 'albedo' }),
          expect.objectContaining({ name: 'constellationLevel', value: 2 }),
        ]),
      );
    });

    it('returns 404 when character not in collection', async () => {
      vi.mocked(Characters.get).mockResolvedValue(null);

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

    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(Characters.save).mockResolvedValue({
        character: FAKE_CHARACTER,
        created: true,
      });
      res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2 }),
      );
      body = (await res.json()) as CollectionDocument;
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    });

    it('returns single-item collection', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes character domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'characterId', value: 'albedo' }),
          expect.objectContaining({ name: 'constellationLevel', value: 2 }),
        ]),
      );
    });

    it('returns 201 when character is newly added', () => {
      expect(res.status).toBe(201);
    });

    it('returns 200 when character is updated', async () => {
      vi.mocked(Characters.save).mockResolvedValue({
        character: FAKE_CHARACTER,
        created: false,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2 }),
      );

      expect(res.status).toBe(200);
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

    it('returns 422 when constellationLevel is missing', async () => {
      const res = await app.request(authedRequest('PUT', '/api/characters/albedo', {}));

      expect(res.status).toBe(422);
    });

    it('returns 422 when constellationLevel is not a number', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 'high' }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when constellationLevel is below minimum', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', {
          constellationLevel: MIN_CONSTELLATION_LEVEL - 1,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when constellationLevel is above maximum', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', {
          constellationLevel: MAX_CONSTELLATION_LEVEL + 1,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when constellationLevel is not an integer', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2.5 }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when body contains extra properties', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/characters/albedo', { constellationLevel: 2, extra: true }),
      );

      expect(res.status).toBe(422);
    });

    it('accepts constellationLevel at minimum boundary', async () => {
      vi.mocked(Characters.save).mockResolvedValue({
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
      vi.mocked(Characters.save).mockResolvedValue({
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
      vi.mocked(Characters.remove).mockResolvedValue();

      const res = await app.request(authedRequest('DELETE', '/api/characters/albedo'));

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });

    it('returns 204 when character does not exist', async () => {
      vi.mocked(Characters.remove).mockResolvedValue();

      const res = await app.request(authedRequest('DELETE', '/api/characters/nonexistent'));

      expect(res.status).toBe(204);
    });
  });
});
