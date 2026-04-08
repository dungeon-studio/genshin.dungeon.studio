// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { NegotiatedContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import { negotiateRequestSchema } from '@/middleware/negotiate-request-schema.js';
import type { ValidatedRequestBodyVariables } from '@/middleware/validate-request-body.js';
import { validateRequestBody } from '@/middleware/validate-request-body.js';
import { teamItemV1 } from '@/profiles/alps/team/item-v1.js';
import { teamPutRequestV1 } from '@/profiles/json-schema/teams/put-request-v1.js';
import { getCharacter } from '@/repositories/characters/index.js';
import { deleteTeam, getTeam, listTeams, saveTeam } from '@/repositories/teams/index.js';
import { getWeapon } from '@/repositories/weapons/index.js';
import { COLLECTION_JSON } from '@genshin/collection-json';
import type { CollectionTeam, TeamMember, TeamSlot, UUID } from '@genshin/domain';
import {
  isValidTeamSlot,
  teamItemDocument,
  teamListDocument,
  validateArtifactPlan,
  validateTeams,
} from '@genshin/domain';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const teams = new Hono<{
  Variables: AuthVariables &
    NegotiatedContentVariables &
    NegotiatedRequestSchemaVariables &
    ValidatedRequestBodyVariables;
}>();

teams.use('*', auth);

teams.use('*', negotiateContent([{ mediaType: COLLECTION_JSON, profile: teamItemV1 }]));

interface UpdateTeamBody {
  name?: string;
  description?: string;
  members?: TeamMember[];
}

function parseSlot(param: string): TeamSlot {
  const slot = Number(param);

  if (String(slot) !== param || !isValidTeamSlot(slot)) {
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
    headers: { 'Content-Type': c.get('negotiatedMediaType') },
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
    headers: { 'Content-Type': c.get('negotiatedMediaType') },
  });
});

// PUT /api/teams/:slot — Create or update team composition (idempotent upsert)
teams.put(
  '/:slot',
  negotiateRequestSchema([teamPutRequestV1]),
  validateRequestBody([teamPutRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const slot = parseSlot(c.req.param('slot'));
    const body = c.get('validatedBody') as UpdateTeamBody;

    if (body.members && body.members.length > 0) {
      await validateMembers(userId, body.members);

      // Cross-team weapon uniqueness: a weapon instance can only be equipped
      // by one character at a time across all teams (#635).
      const allTeams = await listTeams(userId);
      const crossTeamIssues = validateTeams(slot, body.members, allTeams);
      if (crossTeamIssues.length > 0) {
        throw new HTTPException(400, { message: crossTeamIssues[0].message });
      }
    }

    const { team, created } = await saveTeam(userId, slot, {
      name: body.name,
      members: body.members ? (body.members as CollectionTeam['members']) : undefined,
      description: body.description,
    });

    const baseUrl = new URL(c.req.url).origin;

    return c.body(JSON.stringify(teamItemDocument(team, baseUrl)), {
      status: created ? 201 : 200,
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    });
  },
);

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

  await Promise.all(
    members.map(async (member) => {
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
        const issues = validateArtifactPlan(member.artifactPlan);
        if (issues.length > 0) {
          throw new HTTPException(400, { message: issues[0].message });
        }
      }
    }),
  );
}
