// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, UUID } from '@genshin/types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/auth.js', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/repositories/weapons/index.js', () => ({
  listWeapons: vi.fn(),
  listWeaponInstances: vi.fn(),
  createWeaponInstance: vi.fn(),
  updateWeaponInstance: vi.fn(),
  deleteWeaponInstance: vi.fn(),
}));

vi.mock('@genshin/game-data', () => ({
  getWeaponById: vi.fn(),
}));

import { app } from '@/app.js';
import { verifyToken } from '@/lib/firebase/auth.js';
import {
  createWeaponInstance,
  deleteWeaponInstance,
  listWeaponInstances,
  listWeapons,
  updateWeaponInstance,
} from '@/repositories/weapons/index.js';
import { FAKE_TOKEN, FAKE_UID, authedRequest } from '@/test/auth-requests.js';
import { COLLECTION_JSON, type CollectionDocument } from '@genshin/collection-json';
import { getWeaponById } from '@genshin/game-data';
import { MAX_REFINEMENT_LEVEL, MIN_REFINEMENT_LEVEL } from '@genshin/types';

const FAKE_WEAPON: CollectionWeapon = {
  weaponInstanceId: 'instance-uuid-1' as UUID,
  weaponId: 'mistsplitter-reforged',
  refinementLevel: 1,
  createdAt: '2026-01-01T00:00:00.000Z' as CollectionWeapon['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as CollectionWeapon['updatedAt'],
};

const FAKE_WEAPON_ITEM_DATA = [
  { name: 'weaponInstanceId', value: 'instance-uuid-1' },
  { name: 'weaponId', value: 'mistsplitter-reforged' },
  { name: 'refinementLevel', value: 1 },
  { name: 'createdAt', value: '2026-01-01T00:00:00.000Z' },
  { name: 'updatedAt', value: '2026-03-13T00:00:00.000Z' },
];

describe('Weapon routes', () => {
  beforeEach(() => {
    vi.mocked(verifyToken).mockResolvedValue(FAKE_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authentication', () => {
    it('returns 401 without Authorization header', async () => {
      const res = await app.request('/api/weapons');

      expect(res.status).toBe(401);
    });

    it('returns 401 with malformed Authorization header', async () => {
      const res = await app.request('/api/weapons', {
        headers: { Authorization: 'NotBearer token' },
      });

      expect(res.status).toBe(401);
    });

    it('returns 401 when token is expired', async () => {
      vi.mocked(verifyToken).mockRejectedValue({ code: 'auth/id-token-expired' });

      const res = await app.request(authedRequest('GET', '/api/weapons'));

      expect(res.status).toBe(401);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Invalid or expired token');
    });
  });

  describe('GET /api/weapons', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(listWeapons).mockResolvedValue([FAKE_WEAPON]);
      res = await app.request(authedRequest('GET', '/api/weapons'));
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(COLLECTION_JSON);
    });

    it('returns one item per weapon', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes weapon domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'weaponId', value: 'mistsplitter-reforged' }),
          expect.objectContaining({ name: 'refinementLevel', value: 1 }),
        ]),
      );
    });

    it('returns empty items when no weapons exist', async () => {
      vi.mocked(listWeapons).mockResolvedValue([]);

      const res = await app.request(authedRequest('GET', '/api/weapons'));

      const body = (await res.json()) as CollectionDocument;
      expect(body.collection.items).toEqual([]);
    });

    it('returns 500 when repository throws', async () => {
      vi.mocked(listWeapons).mockRejectedValue(new Error('Firestore unavailable'));

      const res = await app.request(authedRequest('GET', '/api/weapons'));

      expect(res.status).toBe(500);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('An unexpected error occurred');
    });
  });

  describe('GET /api/weapons/:weaponId', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
      vi.mocked(listWeaponInstances).mockResolvedValue([FAKE_WEAPON]);
      res = await app.request(authedRequest('GET', '/api/weapons/mistsplitter-reforged'));
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(COLLECTION_JSON);
    });

    it('returns one item per instance', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes weapon domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'weaponId', value: 'mistsplitter-reforged' }),
          expect.objectContaining({ name: 'refinementLevel', value: 1 }),
        ]),
      );
    });

    it('returns empty items when no instances exist', async () => {
      vi.mocked(listWeaponInstances).mockResolvedValue([]);

      const res = await app.request(authedRequest('GET', '/api/weapons/mistsplitter-reforged'));

      const body = (await res.json()) as CollectionDocument;
      expect(body.collection.items).toEqual([]);
    });

    it('returns 400 for unknown weapon ID', async () => {
      vi.mocked(getWeaponById).mockReturnValue(undefined);

      const res = await app.request(authedRequest('GET', '/api/weapons/not-a-weapon'));

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown weapon: not-a-weapon');
    });
  });

  describe('POST /api/weapons/:weaponId', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
      vi.mocked(createWeaponInstance).mockResolvedValue(FAKE_WEAPON);
      res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: 1,
        }),
      );
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 201', () => {
      expect(res.status).toBe(201);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(COLLECTION_JSON);
    });

    it('returns single-item collection', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes weapon domain data', () => {
      expect(body.collection.items[0].data).toEqual(FAKE_WEAPON_ITEM_DATA);
    });

    it('returns 400 for unknown weapon ID', async () => {
      vi.mocked(getWeaponById).mockReturnValue(undefined);

      const res = await app.request(
        authedRequest('POST', '/api/weapons/not-a-weapon', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown weapon: not-a-weapon');
    });

    it('returns 400 when body is not valid JSON', async () => {
      const res = await app.request(
        new Request('http://localhost/api/weapons/mistsplitter-reforged', {
          method: 'POST',
          headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
          body: 'not-json',
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when refinementLevel is missing', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {}),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when refinementLevel is not a number', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: 'R5',
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when refinementLevel is below minimum', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: MIN_REFINEMENT_LEVEL - 1,
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when refinementLevel is above maximum', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: MAX_REFINEMENT_LEVEL + 1,
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when refinementLevel is not an integer', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: 2.5,
        }),
      );

      expect(res.status).toBe(400);
    });

    it('accepts refinementLevel at minimum boundary', async () => {
      vi.mocked(createWeaponInstance).mockResolvedValue({
        ...FAKE_WEAPON,
        refinementLevel: MIN_REFINEMENT_LEVEL,
      });

      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: MIN_REFINEMENT_LEVEL,
        }),
      );

      expect(res.status).toBe(201);
    });

    it('accepts refinementLevel at maximum boundary', async () => {
      vi.mocked(createWeaponInstance).mockResolvedValue({
        ...FAKE_WEAPON,
        refinementLevel: MAX_REFINEMENT_LEVEL,
      });

      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: MAX_REFINEMENT_LEVEL,
        }),
      );

      expect(res.status).toBe(201);
    });
  });

  describe('PUT /api/weapons/:weaponId/:weaponInstanceId', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
      vi.mocked(updateWeaponInstance).mockResolvedValue(FAKE_WEAPON);
      res = await app.request(
        authedRequest('PUT', '/api/weapons/mistsplitter-reforged/instance-uuid-1', {
          refinementLevel: 1,
        }),
      );
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(COLLECTION_JSON);
    });

    it('returns single-item collection', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes weapon domain data', () => {
      expect(body.collection.items[0].data).toEqual(FAKE_WEAPON_ITEM_DATA);
    });

    it('returns 404 when weapon instance not found', async () => {
      vi.mocked(updateWeaponInstance).mockResolvedValue(null);

      const res = await app.request(
        authedRequest('PUT', '/api/weapons/mistsplitter-reforged/nonexistent', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Weapon instance not found');
    });

    it('returns 400 when body is not valid JSON', async () => {
      const res = await app.request(
        new Request('http://localhost/api/weapons/mistsplitter-reforged/instance-uuid-1', {
          method: 'PUT',
          headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
          body: 'not-json',
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 400 when refinementLevel is invalid', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/weapons/mistsplitter-reforged/instance-uuid-1', {
          refinementLevel: 0,
        }),
      );

      expect(res.status).toBe(400);
    });

    it('updates refinementLevel', async () => {
      vi.mocked(updateWeaponInstance).mockResolvedValue({
        ...FAKE_WEAPON,
        refinementLevel: 3,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/weapons/mistsplitter-reforged/instance-uuid-1', {
          refinementLevel: 3,
        }),
      );

      expect(res.status).toBe(200);
      expect(updateWeaponInstance).toHaveBeenCalledWith(
        FAKE_UID,
        'mistsplitter-reforged',
        'instance-uuid-1',
        3,
      );
    });

    it('returns 400 for unknown weapon ID', async () => {
      vi.mocked(getWeaponById).mockReturnValue(undefined);

      const res = await app.request(
        authedRequest('PUT', '/api/weapons/not-a-weapon/instance-uuid-1', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown weapon: not-a-weapon');
    });
  });

  describe('DELETE /api/weapons/:weaponId/:weaponInstanceId', () => {
    beforeEach(() => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
    });

    it('returns 204 with no body', async () => {
      vi.mocked(deleteWeaponInstance).mockResolvedValue();

      const res = await app.request(
        authedRequest('DELETE', '/api/weapons/mistsplitter-reforged/instance-uuid-1'),
      );

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });

    it('returns 400 for unknown weapon ID', async () => {
      vi.mocked(getWeaponById).mockReturnValue(undefined);

      const res = await app.request(
        authedRequest('DELETE', '/api/weapons/not-a-weapon/instance-uuid-1'),
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown weapon: not-a-weapon');
    });
  });
});
