// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, UUID } from '@genshin/domain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/auth.js', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/repositories/weapons/index.js', () => ({
  listWeapons: vi.fn(),
  getWeapon: vi.fn(),
  createWeapon: vi.fn(),
  updateWeapon: vi.fn(),
  deleteWeapon: vi.fn(),
}));

vi.mock('@genshin/game-data', () => ({
  getWeaponById: vi.fn(),
}));

import { app } from '@/app.js';
import { verifyToken } from '@/lib/firebase/auth.js';
import { toMediaTypeString } from '@/middleware/negotiate-content.js';
import { weaponItemV1 } from '@/profiles/alps/weapon/item-v1.js';
import {
  createWeapon,
  deleteWeapon,
  getWeapon,
  listWeapons,
  updateWeapon,
} from '@/repositories/weapons/index.js';
import { FAKE_TOKEN, authedRequest } from '@/test/auth-requests.js';
import { COLLECTION_JSON, type CollectionDocument } from '@genshin/collection-json';
import { MAX_REFINEMENT_LEVEL, MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import { getWeaponById } from '@genshin/game-data';

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

const EXPECTED_CONTENT_TYPE = toMediaTypeString(
  { mediaType: COLLECTION_JSON, profile: weaponItemV1 },
  'http://localhost',
);

describe('Weapon routes', () => {
  beforeEach(() => {
    vi.mocked(verifyToken).mockResolvedValue(FAKE_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
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
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
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

  describe('GET /api/weapons?weaponId=', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
      vi.mocked(listWeapons).mockResolvedValue([FAKE_WEAPON]);
      res = await app.request(authedRequest('GET', '/api/weapons?weaponId=mistsplitter-reforged'));
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
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
      vi.mocked(listWeapons).mockResolvedValue([]);

      const res = await app.request(
        authedRequest('GET', '/api/weapons?weaponId=mistsplitter-reforged'),
      );

      const body = (await res.json()) as CollectionDocument;
      expect(body.collection.items).toEqual([]);
    });

    it('returns 400 for unknown weapon ID', async () => {
      vi.mocked(getWeaponById).mockReturnValue(undefined);

      const res = await app.request(authedRequest('GET', '/api/weapons?weaponId=not-a-weapon'));

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown weapon: not-a-weapon');
    });

    it('returns 400 for empty weaponId', async () => {
      const res = await app.request(authedRequest('GET', '/api/weapons?weaponId='));

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('weaponId query parameter must not be empty');
    });
  });

  describe('POST /api/weapons', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
      vi.mocked(createWeapon).mockResolvedValue(FAKE_WEAPON);
      res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: 1,
        }),
      );
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 201', () => {
      expect(res.status).toBe(201);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    });

    it('returns Location header pointing to created instance', () => {
      expect(res.headers.get('location')).toBe('http://localhost/api/weapons/instance-uuid-1');
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
        authedRequest('POST', '/api/weapons', {
          weaponId: 'not-a-weapon',
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(400);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Unknown weapon: not-a-weapon');
    });

    it('returns 400 when body is not valid JSON', async () => {
      const res = await app.request(
        new Request('http://localhost/api/weapons', {
          method: 'POST',
          headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
          body: 'not-json',
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 422 when weaponId is missing', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when refinementLevel is missing', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when refinementLevel is not a number', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: 'R5',
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when refinementLevel is below minimum', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: MIN_REFINEMENT_LEVEL - 1,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when refinementLevel is above maximum', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: MAX_REFINEMENT_LEVEL + 1,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when refinementLevel is not an integer', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: 2.5,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when body contains extra properties', async () => {
      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: 1,
          extra: true,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('accepts refinementLevel at minimum boundary', async () => {
      vi.mocked(createWeapon).mockResolvedValue({
        ...FAKE_WEAPON,
        refinementLevel: MIN_REFINEMENT_LEVEL,
      });

      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: MIN_REFINEMENT_LEVEL,
        }),
      );

      expect(res.status).toBe(201);
    });

    it('accepts refinementLevel at maximum boundary', async () => {
      vi.mocked(createWeapon).mockResolvedValue({
        ...FAKE_WEAPON,
        refinementLevel: MAX_REFINEMENT_LEVEL,
      });

      const res = await app.request(
        authedRequest('POST', '/api/weapons', {
          weaponId: 'mistsplitter-reforged',
          refinementLevel: MAX_REFINEMENT_LEVEL,
        }),
      );

      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/weapons/:weaponInstanceId', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getWeapon).mockResolvedValue(FAKE_WEAPON);
      res = await app.request(authedRequest('GET', '/api/weapons/instance-uuid-1'));
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

    it('includes weapon domain data', () => {
      expect(body.collection.items[0].data).toEqual(FAKE_WEAPON_ITEM_DATA);
    });

    it('returns 404 when weapon instance not found', async () => {
      vi.mocked(getWeapon).mockResolvedValue(null);

      const res = await app.request(authedRequest('GET', '/api/weapons/nonexistent'));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Weapon instance not found');
    });
  });

  describe('PATCH /api/weapons/:weaponInstanceId', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(updateWeapon).mockResolvedValue(FAKE_WEAPON);
      res = await app.request(
        authedRequest('PATCH', '/api/weapons/instance-uuid-1', {
          refinementLevel: 1,
        }),
      );
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

    it('includes weapon domain data', () => {
      expect(body.collection.items[0].data).toEqual(FAKE_WEAPON_ITEM_DATA);
    });

    it('returns 404 when weapon instance not found', async () => {
      vi.mocked(updateWeapon).mockResolvedValue(null);

      const res = await app.request(
        authedRequest('PATCH', '/api/weapons/nonexistent', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Weapon instance not found');
    });

    it('returns 400 when body is not valid JSON', async () => {
      const res = await app.request(
        new Request('http://localhost/api/weapons/instance-uuid-1', {
          method: 'PATCH',
          headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
          body: 'not-json',
        }),
      );

      expect(res.status).toBe(400);
    });

    it('returns 422 when refinementLevel is invalid', async () => {
      const res = await app.request(
        authedRequest('PATCH', '/api/weapons/instance-uuid-1', {
          refinementLevel: 0,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when body contains extra properties', async () => {
      const res = await app.request(
        authedRequest('PATCH', '/api/weapons/instance-uuid-1', {
          refinementLevel: 1,
          extra: true,
        }),
      );

      expect(res.status).toBe(422);
    });

    it('updates refinementLevel', async () => {
      vi.mocked(updateWeapon).mockResolvedValue({
        ...FAKE_WEAPON,
        refinementLevel: 3,
      });

      const res = await app.request(
        authedRequest('PATCH', '/api/weapons/instance-uuid-1', {
          refinementLevel: 3,
        }),
      );

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/weapons/:weaponInstanceId', () => {
    it('returns 204 with no body', async () => {
      vi.mocked(deleteWeapon).mockResolvedValue();

      const res = await app.request(authedRequest('DELETE', '/api/weapons/instance-uuid-1'));

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });
  });
});
