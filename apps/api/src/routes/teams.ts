// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { COLLECTION_JSON } from '@genshin/collection-json';
import type { CollectionTeamMember, CollectionTeamMembers, TeamSlot, UUID } from '@genshin/domain';
import {
  deserialiseCollectionTeamMembers,
  isValidTeamSlot,
  teamItemDocument,
  teamListDocument,
  validateArtifactPlan,
  validateAcrossTeams,
} from '@genshin/domain';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { FromSchema } from 'json-schema-to-ts';

import { auth } from '@/middleware/auth.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import { negotiateRequestSchema } from '@/middleware/negotiate-request-schema.js';
import { validateRequestBody } from '@/middleware/validate-request-body.js';
import { teamItemV1 } from '@/profiles/alps/team/item-v1.js';
import { teamPutRequestV1 } from '@/profiles/json-schema/teams/put-request-v1.js';
import * as Characters from '@/repositories/characters/index.js';
import * as Teams from '@/repositories/teams/index.js';
import * as Weapons from '@/repositories/weapons/index.js';
import type { AuthenticatedRouteVariables } from '@/routes/variables.js';

/**
 * The signed-in caller's four team loadouts, addressed by slot.
 *
 * The slots are fixed, so `PUT` to one is an upsert and `DELETE` clears it back
 * to unsaved rather than removing an addressable resource. A slot outside 1 to
 * 4 is 404, not 400: it names no resource.
 *
 * A save is checked against the caller's other teams as well as its own
 * contents, so a weapon another character already equips is rejected here even
 * though the body itself is valid.
 */
export const teams = new Hono<{
  Variables: AuthenticatedRouteVariables;
}>();

teams.use('*', auth);

teams.use('*', negotiateContent([{ mediaType: COLLECTION_JSON, profile: teamItemV1 }]));

type UpdateTeamBody = FromSchema<typeof teamPutRequestV1.schema>;

function parseSlot(param: string): TeamSlot {
  const slot = Number(param);

  if (String(slot) !== param || !isValidTeamSlot(slot)) {
    throw new HTTPException(404, { message: 'Team slot must be 1, 2, 3, or 4' });
  }

  return slot;
}

// GET /teams — List user's teams
teams.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await Teams.list(userId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(teamListDocument(items, baseUrl)), {
    headers: { 'Content-Type': c.get('negotiatedMediaType') },
  });
});

// GET /teams/:slot — Get specific team
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

// PUT /teams/:slot — Create or update team composition (idempotent upsert)
teams.put(
  '/:slot',
  negotiateRequestSchema([teamPutRequestV1]),
  validateRequestBody([teamPutRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const slot = parseSlot(c.req.param('slot'));
    const body = c.get('validatedBody') as UpdateTeamBody;
    const members = body.members && deserialiseCollectionTeamMembers(body.members);

    if (members) {
      await validateComposition(userId, slot, members);
    }

    const { team, created } = await Teams.save(userId, slot, { ...body, members });

    const baseUrl = new URL(c.req.url).origin;

    return c.body(JSON.stringify(teamItemDocument(team, baseUrl)), {
      status: created ? 201 : 200,
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    });
  },
);

// DELETE /teams/:slot — Remove team
teams.delete('/:slot', async (c) => {
  const userId = c.get('user').uid;
  const slot = parseSlot(c.req.param('slot'));

  await Teams.remove(userId, slot);

  return c.body(null, 204);
});

async function validateComposition(
  userId: string,
  slot: TeamSlot,
  members: CollectionTeamMembers,
): Promise<void> {
  const occupied = members.filter((m): m is CollectionTeamMember => m !== null);

  if (occupied.length === 0) {
    return;
  }

  await validateMembers(userId, occupied);

  // Cross-team weapon uniqueness: a weapon instance can only be equipped by one
  // character at a time across all teams (#635).
  const issues = validateAcrossTeams(slot, members, await Teams.list(userId));

  if (issues.length > 0) {
    throw new HTTPException(400, { message: issues[0].message });
  }
}

async function validateMembers(userId: string, members: CollectionTeamMember[]): Promise<void> {
  // No duplicate character IDs
  const characterIds = members.map((m) => m.characterId);
  if (new Set(characterIds).size !== characterIds.length) {
    throw new HTTPException(400, { message: 'Duplicate character IDs in team' });
  }

  // No duplicate weapon instance IDs
  const weaponIds = members.flatMap((m) => (m.weaponInstanceId ? [m.weaponInstanceId] : []));
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
