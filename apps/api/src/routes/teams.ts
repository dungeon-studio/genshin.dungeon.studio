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
import * as Characters from '@/repositories/characters/index.js';
import * as Teams from '@/repositories/teams/index.js';
import * as Weapons from '@/repositories/weapons/index.js';
import { COLLECTION_JSON } from '@genshin/collection-json';
import type { CollectionTeamMember, CollectionTeamMembers, TeamSlot, UUID } from '@genshin/domain';
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
  members?: CollectionTeamMembers;
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
  const items = await Teams.list(userId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(teamListDocument(items, baseUrl)), {
    headers: { 'Content-Type': c.get('negotiatedMediaType') },
  });
});

// GET /api/teams/:slot — Get specific team
teams.get('/:slot', async (c) => {
  const userId = c.get('user').uid;
  const slot = parseSlot(c.req.param('slot'));

  const team = await Teams.get(userId, slot);

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

    if (body.members) {
      const nonNullMembers = body.members.filter((m): m is CollectionTeamMember => m !== null);
      if (nonNullMembers.length > 0) {
        await validateMembers(userId, nonNullMembers);

        // Cross-team weapon uniqueness: a weapon instance can only be equipped
        // by one character at a time across all teams (#635).
        const allTeams = await Teams.list(userId);
        const crossTeamIssues = validateTeams(slot, body.members, allTeams);
        if (crossTeamIssues.length > 0) {
          throw new HTTPException(400, { message: crossTeamIssues[0].message });
        }
      }
    }

    const { team, created } = await Teams.save(userId, slot, {
      name: body.name,
      members: body.members,
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

  await Teams.remove(userId, slot);

  return c.body(null, 204);
});

async function validateMembers(userId: string, members: CollectionTeamMember[]): Promise<void> {
  // No duplicate character IDs
  const characterIds = members.map((m) => m.characterId);
  if (new Set(characterIds).size !== characterIds.length) {
    throw new HTTPException(400, { message: 'Duplicate character IDs in team' });
  }

  // No duplicate weapon instance IDs
  const weaponIds = members.filter((m) => m.weaponInstanceId).map((m) => m.weaponInstanceId!);
  if (new Set(weaponIds).size !== weaponIds.length) {
    throw new HTTPException(400, { message: 'Duplicate weapon instance IDs in team' });
  }

  await Promise.all(
    members.map(async (member) => {
      // Character must be in user's collection
      const character = await Characters.get(userId, member.characterId);
      if (!character) {
        throw new HTTPException(400, {
          message: `Character not in collection: ${member.characterId}`,
        });
      }

      // Weapon instance must be in user's collection (if provided)
      if (member.weaponInstanceId) {
        const weapon = await Weapons.get(userId, member.weaponInstanceId as UUID);
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
