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
import { getWeaponById } from '@genshin/game-data';
import { MAX_REFINEMENT_LEVEL, MIN_REFINEMENT_LEVEL } from '@genshin/types';

const FAKE_WEAPON: CollectionWeapon = {
  weaponInstanceId: 'instance-uuid-1' as UUID,
  weaponId: 'mistsplitter-reforged',
  refinementLevel: 1,
  createdAt: '2026-01-01T00:00:00.000Z' as CollectionWeapon['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as CollectionWeapon['updatedAt'],
};

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
  });

  describe('GET /api/weapons', () => {
    it('returns 200 with weapons grouped by weaponId', async () => {
      vi.mocked(listWeapons).mockResolvedValue({
        'mistsplitter-reforged': [FAKE_WEAPON],
      });

      const res = await app.request(authedRequest('GET', '/api/weapons'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ 'mistsplitter-reforged': [FAKE_WEAPON] });
    });

    it('returns 200 with empty object when no weapons', async () => {
      vi.mocked(listWeapons).mockResolvedValue({});

      const res = await app.request(authedRequest('GET', '/api/weapons'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({});
    });
  });

  describe('GET /api/weapons/:weaponId', () => {
    it('returns 200 with instances of specific weapon', async () => {
      vi.mocked(listWeaponInstances).mockResolvedValue([FAKE_WEAPON]);

      const res = await app.request(authedRequest('GET', '/api/weapons/mistsplitter-reforged'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([FAKE_WEAPON]);
    });

    it('returns 200 with empty list when no instances', async () => {
      vi.mocked(listWeaponInstances).mockResolvedValue([]);

      const res = await app.request(authedRequest('GET', '/api/weapons/mistsplitter-reforged'));

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });

  describe('POST /api/weapons/:weaponId', () => {
    beforeEach(() => {
      vi.mocked(getWeaponById).mockReturnValue({
        id: 'mistsplitter-reforged',
        name: 'Mistsplitter Reforged',
      } as ReturnType<typeof getWeaponById>);
    });

    it('returns 201 when weapon instance is created', async () => {
      vi.mocked(createWeaponInstance).mockResolvedValue(FAKE_WEAPON);

      const res = await app.request(
        authedRequest('POST', '/api/weapons/mistsplitter-reforged', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual(FAKE_WEAPON);
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
    it('returns 200 when weapon instance is updated', async () => {
      vi.mocked(updateWeaponInstance).mockResolvedValue(FAKE_WEAPON);

      const res = await app.request(
        authedRequest('PUT', '/api/weapons/mistsplitter-reforged/instance-uuid-1', {
          refinementLevel: 1,
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(FAKE_WEAPON);
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
  });

  describe('DELETE /api/weapons/:weaponId/:weaponInstanceId', () => {
    it('returns 204 with no body', async () => {
      vi.mocked(deleteWeaponInstance).mockResolvedValue();

      const res = await app.request(
        authedRequest('DELETE', '/api/weapons/mistsplitter-reforged/instance-uuid-1'),
      );

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });
  });
});
