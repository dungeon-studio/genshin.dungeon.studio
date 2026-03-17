// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { ValidatedBodyVariables } from '@/middleware/validate-body.js';
import { validateBody } from '@/middleware/validate-body.js';
import { getCharacter } from '@/repositories/characters/index.js';
import { deleteTeam, getTeam, listTeams, saveTeam } from '@/repositories/teams/index.js';
import { getWeapon } from '@/repositories/weapons/index.js';
import { teamPutRequestV1 } from '@/schemas/teams/put-request-v1.js';
import { COLLECTION_JSON } from '@genshin/collection-json';
import type { ArtifactPlan, CollectionTeam, TeamMember, TeamSlot, UUID } from '@genshin/domain';
import { isValidTeamSlot, teamItemDocument, teamListDocument } from '@genshin/domain';
import { getArtifactSetById } from '@genshin/game-data';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const teams = new Hono<{ Variables: AuthVariables & ValidatedBodyVariables }>();

teams.use('*', auth);

const PROFILE_PATH = '/profiles/teams/1.0.0.json';

interface UpdateTeamBody {
  name?: string;
  description?: string;
  members?: TeamMember[];
}

function parseSlot(param: string): TeamSlot {
  const slot = Number(param);

  if (!isValidTeamSlot(slot)) {
    throw new HTTPException(404, { message: 'Team slot must be 1, 2, 3, or 4' });
  }

  return slot;
}

// GET /api/teams — List user's teams
teams.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await listTeams(userId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(teamListDocument(items, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// GET /api/teams/:slot — Get specific team
teams.get('/:slot', async (c) => {
  const userId = c.get('user').uid;
  const slot = parseSlot(c.req.param('slot'));

  const team = await getTeam(userId, slot);

  if (!team) {
    throw new HTTPException(404, { message: 'Team not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(teamItemDocument(team, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// PUT /api/teams/:slot — Create or update team composition (idempotent upsert)
teams.put('/:slot', validateBody(teamPutRequestV1.schema), async (c) => {
  const userId = c.get('user').uid;
  const slot = parseSlot(c.req.param('slot'));
  const body = c.get('validatedBody') as UpdateTeamBody;

  if (body.members && body.members.length > 0) {
    await validateMembers(userId, body.members);
  }

  const { team, created } = await saveTeam(userId, slot, {
    name: body.name,
    members: body.members ? (body.members as CollectionTeam['members']) : undefined,
    description: body.description,
  });

  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(teamItemDocument(team, baseUrl)), {
    status: created ? 201 : 200,
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// DELETE /api/teams/:slot — Remove team
teams.delete('/:slot', async (c) => {
  const userId = c.get('user').uid;
  const slot = parseSlot(c.req.param('slot'));

  await deleteTeam(userId, slot);

  return c.body(null, 204);
});

async function validateMembers(userId: string, members: TeamMember[]): Promise<void> {
  // No duplicate character IDs
  const characterIds = members.map((m) => m.characterId);
  if (new Set(characterIds).size !== characterIds.length) {
    throw new HTTPException(400, { message: 'Duplicate character IDs in team' });
  }

  for (const member of members) {
    // Character must be in user's collection
    const character = await getCharacter(userId, member.characterId);
    if (!character) {
      throw new HTTPException(400, {
        message: `Character not in collection: ${member.characterId}`,
      });
    }

    // Weapon instance must be in user's collection (if provided)
    if (member.weaponInstanceId) {
      const weapon = await getWeapon(userId, member.weaponInstanceId as UUID);
      if (!weapon) {
        throw new HTTPException(400, {
          message: `Weapon instance not in collection: ${member.weaponInstanceId}`,
        });
      }
    }

    // Validate artifact plan if provided
    if (member.artifactPlan) {
      validateArtifactPlan(member.artifactPlan);
    }
  }
}

function validateArtifactPlan(plan: ArtifactPlan): void {
  // Artifact sets must reference valid game data
  for (const setId of plan.sets) {
    if (!getArtifactSetById(setId)) {
      throw new HTTPException(400, { message: `Unknown artifact set: ${setId}` });
    }
  }

  // Primary and secondary stats must be disjoint
  const primarySet = new Set(plan.primaryStats);
  const overlap = plan.secondaryStats.filter((s) => primarySet.has(s));
  if (overlap.length > 0) {
    throw new HTTPException(400, {
      message: `Primary and secondary stats must be disjoint. Overlap: ${overlap.join(', ')}`,
    });
  }
}
