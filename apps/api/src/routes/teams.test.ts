// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, CollectionTeam, CollectionWeapon, UUID } from '@genshin/domain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/firebase/auth.js', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('@/repositories/teams/index.js', () => ({
  listTeams: vi.fn(),
  getTeam: vi.fn(),
  saveTeam: vi.fn(),
  deleteTeam: vi.fn(),
}));

vi.mock('@/repositories/characters/index.js', () => ({
  getCharacter: vi.fn(),
}));

vi.mock('@/repositories/weapons/index.js', () => ({
  getWeapon: vi.fn(),
}));

vi.mock('@genshin/game-data', () => ({
  getArtifactSetById: vi.fn(),
}));

import { app } from '@/app.js';
import { verifyToken } from '@/lib/firebase/auth.js';
import { getCharacter } from '@/repositories/characters/index.js';
import { deleteTeam, getTeam, listTeams, saveTeam } from '@/repositories/teams/index.js';
import { getWeapon } from '@/repositories/weapons/index.js';
import { FAKE_TOKEN, authedRequest } from '@/test/auth-requests.js';
import { COLLECTION_JSON, type CollectionDocument } from '@genshin/collection-json';
import { getArtifactSetById } from '@genshin/game-data';

const FAKE_TEAM: CollectionTeam = {
  slot: 1,
  name: 'Team 1',
  members: [
    { characterId: 'hu-tao', weaponInstanceId: 'uuid-1' as UUID },
    { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' as UUID },
    { characterId: 'zhongli', weaponInstanceId: 'uuid-3' as UUID },
    { characterId: 'albedo', weaponInstanceId: 'uuid-4' as UUID },
  ],
  createdAt: '2026-01-01T00:00:00.000Z' as CollectionTeam['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as CollectionTeam['updatedAt'],
};

const FAKE_EMPTY_TEAM: CollectionTeam = {
  slot: 2,
  name: 'Team 2',
  members: [],
  createdAt: '2026-01-01T00:00:00.000Z' as CollectionTeam['createdAt'],
  updatedAt: '2026-03-13T00:00:00.000Z' as CollectionTeam['updatedAt'],
};

const EXPECTED_CONTENT_TYPE = `${COLLECTION_JSON}; profile="http://localhost/profiles/teams/1.0.0.json"`;

function mockCharacterOwned() {
  vi.mocked(getCharacter).mockResolvedValue({
    characterId: 'hu-tao',
    constellationLevel: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as CollectionCharacter);
}

function mockWeaponOwned() {
  vi.mocked(getWeapon).mockResolvedValue({
    weaponInstanceId: 'uuid-1' as UUID,
    weaponId: 'staff-of-homa',
    refinementLevel: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  } as CollectionWeapon);
}

function mockArtifactSetValid() {
  vi.mocked(getArtifactSetById).mockReturnValue({
    id: 'crimson-witch-of-flames',
    name: 'Crimson Witch of Flames',
    version: '1.0',
    bonuses: { 2: 'Pyro DMG +15%', 4: 'Overloaded and Burning +40%' },
  });
}

describe('Team routes', () => {
  beforeEach(() => {
    vi.mocked(verifyToken).mockResolvedValue(FAKE_TOKEN);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/teams', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(listTeams).mockResolvedValue([FAKE_TEAM, FAKE_EMPTY_TEAM]);
      res = await app.request(authedRequest('GET', '/api/teams'));
      body = (await res.json()) as CollectionDocument;
    });

    it('returns 200', () => {
      expect(res.status).toBe(200);
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    });

    it('returns one item per team', () => {
      expect(body.collection.items).toHaveLength(2);
    });

    it('includes team domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'slot', value: 1 }),
          expect.objectContaining({ name: 'name', value: 'Team 1' }),
        ]),
      );
    });

    it('returns empty items when no teams exist', async () => {
      vi.mocked(listTeams).mockResolvedValue([]);

      const res = await app.request(authedRequest('GET', '/api/teams'));

      const body = (await res.json()) as CollectionDocument;
      expect(body.collection.items).toEqual([]);
    });

    it('returns 500 when repository throws', async () => {
      vi.mocked(listTeams).mockRejectedValue(new Error('Firestore unavailable'));

      const res = await app.request(authedRequest('GET', '/api/teams'));

      expect(res.status).toBe(500);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('An unexpected error occurred');
    });
  });

  describe('GET /api/teams/:slot', () => {
    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(getTeam).mockResolvedValue(FAKE_TEAM);
      res = await app.request(authedRequest('GET', '/api/teams/1'));
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

    it('includes team domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'slot', value: 1 }),
          expect.objectContaining({ name: 'name', value: 'Team 1' }),
        ]),
      );
    });

    it('returns 404 when team not found', async () => {
      vi.mocked(getTeam).mockResolvedValue(null);

      const res = await app.request(authedRequest('GET', '/api/teams/1'));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Team not found');
    });

    it('returns 404 for invalid slot', async () => {
      const res = await app.request(authedRequest('GET', '/api/teams/5'));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Team slot must be 1, 2, 3, or 4');
    });

    it('returns 404 for non-numeric slot', async () => {
      const res = await app.request(authedRequest('GET', '/api/teams/abc'));

      expect(res.status).toBe(404);
    });

    it('returns 404 for slot with trailing characters', async () => {
      const res = await app.request(authedRequest('GET', '/api/teams/1abc'));

      expect(res.status).toBe(404);
    });

    it('returns 404 for non-canonical slot like 01', async () => {
      const res = await app.request(authedRequest('GET', '/api/teams/01'));

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/teams/:slot', () => {
    beforeEach(() => {
      mockCharacterOwned();
      mockWeaponOwned();
    });

    let res: Response;
    let body: CollectionDocument;

    beforeEach(async () => {
      vi.mocked(saveTeam).mockResolvedValue({
        team: FAKE_TEAM,
        created: true,
      });
      res = await app.request(
        authedRequest('PUT', '/api/teams/1', {
          name: 'Team 1',
          members: FAKE_TEAM.members,
        }),
      );
      body = (await res.json()) as CollectionDocument;
    });

    it('returns collection+json content type', () => {
      expect(res.headers.get('content-type')).toBe(EXPECTED_CONTENT_TYPE);
    });

    it('returns single-item collection', () => {
      expect(body.collection.items).toHaveLength(1);
    });

    it('includes team domain data', () => {
      expect(body.collection.items[0].data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'slot', value: 1 }),
          expect.objectContaining({ name: 'name', value: 'Team 1' }),
        ]),
      );
    });

    it('returns 201 when team is newly created', () => {
      expect(res.status).toBe(201);
    });

    it('returns 200 when team is updated', async () => {
      vi.mocked(saveTeam).mockResolvedValue({
        team: FAKE_TEAM,
        created: false,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/teams/1', {
          name: 'Updated Team',
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 404 for invalid slot', async () => {
      const res = await app.request(authedRequest('PUT', '/api/teams/5', { name: 'Team' }));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Team slot must be 1, 2, 3, or 4');
    });

    it('allows name-only update', async () => {
      vi.mocked(saveTeam).mockResolvedValue({
        team: { ...FAKE_TEAM, name: 'Renamed' },
        created: false,
      });

      const res = await app.request(authedRequest('PUT', '/api/teams/1', { name: 'Renamed' }));

      expect(res.status).toBe(200);
    });

    it('allows clearing members with empty array', async () => {
      vi.mocked(saveTeam).mockResolvedValue({
        team: FAKE_EMPTY_TEAM,
        created: false,
      });

      const res = await app.request(authedRequest('PUT', '/api/teams/1', { members: [] }));

      expect(res.status).toBe(200);
    });

    it('allows partial team with fewer than 4 members', async () => {
      vi.mocked(saveTeam).mockResolvedValue({
        team: {
          ...FAKE_TEAM,
          members: [{ characterId: 'hu-tao', weaponInstanceId: 'uuid-1' as UUID }],
        },
        created: false,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/teams/1', {
          members: [{ characterId: 'hu-tao', weaponInstanceId: 'uuid-1' }],
        }),
      );

      expect(res.status).toBe(200);
    });

    it('allows member without weapon (optimizer placeholder)', async () => {
      vi.mocked(saveTeam).mockResolvedValue({
        team: {
          ...FAKE_TEAM,
          members: [{ characterId: 'hu-tao' }],
        },
        created: false,
      });

      const res = await app.request(
        authedRequest('PUT', '/api/teams/1', {
          members: [{ characterId: 'hu-tao' }],
        }),
      );

      expect(res.status).toBe(200);
    });

    it('returns 422 when members array has more than 4', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/teams/1', {
          members: [
            { characterId: 'hu-tao', weaponInstanceId: 'uuid-1' },
            { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' },
            { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
            { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            { characterId: 'ganyu', weaponInstanceId: 'uuid-5' },
          ],
        }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 422 when body contains extra properties', async () => {
      const res = await app.request(
        authedRequest('PUT', '/api/teams/1', { name: 'Team', extra: true }),
      );

      expect(res.status).toBe(422);
    });

    it('returns 400 when body is not valid JSON', async () => {
      const res = await app.request(
        new Request('http://localhost/api/teams/1', {
          method: 'PUT',
          headers: { Authorization: 'Bearer valid-token', 'Content-Type': 'application/json' },
          body: 'not-json',
        }),
      );

      expect(res.status).toBe(400);
    });

    describe('ownership validation', () => {
      it('returns 400 for duplicate character IDs', async () => {
        const res = await app.request(
          authedRequest('PUT', '/api/teams/1', {
            members: [
              { characterId: 'hu-tao', weaponInstanceId: 'uuid-1' },
              { characterId: 'hu-tao', weaponInstanceId: 'uuid-2' },
              { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
              { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            ],
          }),
        );

        expect(res.status).toBe(400);
        const body = (await res.json()) as { detail: string };
        expect(body.detail).toBe('Duplicate character IDs in team');
      });

      it('returns 400 when character not in collection', async () => {
        vi.mocked(getCharacter).mockResolvedValue(null);

        const res = await app.request(
          authedRequest('PUT', '/api/teams/1', {
            members: [
              { characterId: 'hu-tao', weaponInstanceId: 'uuid-1' },
              { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' },
              { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
              { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            ],
          }),
        );

        expect(res.status).toBe(400);
        const body = (await res.json()) as { detail: string };
        expect(body.detail).toContain('Character not in collection');
      });

      it('returns 400 when weapon instance not in collection', async () => {
        vi.mocked(getWeapon).mockResolvedValue(null);

        const res = await app.request(
          authedRequest('PUT', '/api/teams/1', {
            members: [
              { characterId: 'hu-tao', weaponInstanceId: 'uuid-1' },
              { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' },
              { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
              { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            ],
          }),
        );

        expect(res.status).toBe(400);
        const body = (await res.json()) as { detail: string };
        expect(body.detail).toContain('Weapon instance not in collection');
      });

      it('returns 400 for unknown artifact set', async () => {
        mockArtifactSetValid();
        vi.mocked(getArtifactSetById).mockReturnValueOnce(undefined);

        const res = await app.request(
          authedRequest('PUT', '/api/teams/1', {
            members: [
              {
                characterId: 'hu-tao',
                weaponInstanceId: 'uuid-1',
                artifactPlan: {
                  sands: 'HP%',
                  goblet: 'Pyro DMG',
                  circlet: 'Crit DMG',
                  sets: ['fake-set'],
                  primaryStats: ['Crit Rate'],
                  secondaryStats: ['ATK%'],
                },
              },
              { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' },
              { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
              { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            ],
          }),
        );

        expect(res.status).toBe(400);
        const body = (await res.json()) as { detail: string };
        expect(body.detail).toContain('Unknown artifact set');
      });

      it('returns 400 when primary and secondary stats overlap', async () => {
        mockArtifactSetValid();

        const res = await app.request(
          authedRequest('PUT', '/api/teams/1', {
            members: [
              {
                characterId: 'hu-tao',
                weaponInstanceId: 'uuid-1',
                artifactPlan: {
                  sands: 'HP%',
                  goblet: 'Pyro DMG',
                  circlet: 'Crit DMG',
                  sets: ['crimson-witch-of-flames'],
                  primaryStats: ['Crit Rate', 'Crit DMG'],
                  secondaryStats: ['Crit Rate', 'ATK%'],
                },
              },
              { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' },
              { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
              { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            ],
          }),
        );

        expect(res.status).toBe(400);
        const body = (await res.json()) as { detail: string };
        expect(body.detail).toContain('Primary and secondary stats must be disjoint');
      });

      it('accepts valid artifact plan', async () => {
        mockArtifactSetValid();
        vi.mocked(saveTeam).mockResolvedValue({
          team: FAKE_TEAM,
          created: true,
        });

        const res = await app.request(
          authedRequest('PUT', '/api/teams/1', {
            members: [
              {
                characterId: 'hu-tao',
                weaponInstanceId: 'uuid-1',
                artifactPlan: {
                  sands: 'HP%',
                  goblet: 'Pyro DMG',
                  circlet: 'Crit DMG',
                  sets: ['crimson-witch-of-flames'],
                  primaryStats: ['Crit Rate', 'Crit DMG'],
                  secondaryStats: ['ATK%', 'HP%'],
                },
              },
              { characterId: 'xingqiu', weaponInstanceId: 'uuid-2' },
              { characterId: 'zhongli', weaponInstanceId: 'uuid-3' },
              { characterId: 'albedo', weaponInstanceId: 'uuid-4' },
            ],
          }),
        );

        expect(res.status).toBe(201);
      });
    });
  });

  describe('DELETE /api/teams/:slot', () => {
    it('returns 204 with no body', async () => {
      vi.mocked(deleteTeam).mockResolvedValue();

      const res = await app.request(authedRequest('DELETE', '/api/teams/1'));

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    });

    it('returns 204 when team does not exist', async () => {
      vi.mocked(deleteTeam).mockResolvedValue();

      const res = await app.request(authedRequest('DELETE', '/api/teams/4'));

      expect(res.status).toBe(204);
    });

    it('returns 404 for invalid slot', async () => {
      const res = await app.request(authedRequest('DELETE', '/api/teams/5'));

      expect(res.status).toBe(404);
      const body = (await res.json()) as { detail: string };
      expect(body.detail).toBe('Team slot must be 1, 2, 3, or 4');
    });
  });
});
