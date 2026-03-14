// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import { validateBody } from '@/middleware/validate-body.js';
import {
  createWeaponInstance,
  deleteWeaponInstance,
  listWeaponInstances,
  listWeapons,
  updateWeaponInstance,
} from '@/repositories/weapons/index.js';
import {
  weaponInstanceListDocument,
  weaponItemDocument,
  weaponItemHref,
  weaponListDocument,
} from '@/representations/collection-json/weapons.js';
import weaponPostSchema from '@/schemas/weapons/post/1.0.0.json' with { type: 'json' };
import weaponPutSchema from '@/schemas/weapons/put/1.0.0.json' with { type: 'json' };
import { COLLECTION_JSON } from '@genshin/collection-json';
import { getWeaponById } from '@genshin/game-data';
import type { UUID } from '@genshin/types';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const weapons = new Hono<{ Variables: AuthVariables }>();

weapons.use('*', auth);

const PROFILE_PATH = '/profiles/weapons/1.0.0.json';

interface CreateWeaponBody {
  refinementLevel: number;
}

interface UpdateWeaponBody {
  refinementLevel: number;
}

// GET /api/weapons — List all weapon instances as a flat collection
weapons.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await listWeapons(userId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponListDocument(items, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// GET /api/weapons/:weaponId — List instances of specific weapon
weapons.get('/:weaponId', async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();

  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  const instances = await listWeaponInstances(userId, weaponId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponInstanceListDocument(instances, weaponId, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// POST /api/weapons/:weaponId — Create new weapon instance
weapons.post('/:weaponId', validateBody(weaponPostSchema), async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();

  // Verify weaponId exists in game data
  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  const { refinementLevel } = await c.req.json<CreateWeaponBody>();

  const weapon = await createWeaponInstance(userId, weaponId, refinementLevel);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponInstanceListDocument([weapon], weaponId, baseUrl)), {
    status: 201,
    headers: {
      'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"`,
      Location: weaponItemHref(baseUrl, weapon),
    },
  });
});

// PUT /api/weapons/:weaponId/:weaponInstanceId — Update weapon instance
weapons.put('/:weaponId/:weaponInstanceId', validateBody(weaponPutSchema), async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  const { refinementLevel } = await c.req.json<UpdateWeaponBody>();

  const weapon = await updateWeaponInstance(userId, weaponId, weaponInstanceId, refinementLevel);

  if (!weapon) {
    throw new HTTPException(404, { message: 'Weapon instance not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponItemDocument(weapon, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// DELETE /api/weapons/:weaponId/:weaponInstanceId — Delete weapon instance
weapons.delete('/:weaponId/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  await deleteWeaponInstance(userId, weaponId, weaponInstanceId);

  return c.body(null, 204);
});
