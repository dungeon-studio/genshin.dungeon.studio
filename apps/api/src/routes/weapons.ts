// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
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
  weaponListDocument,
} from '@/representations/collection-json/weapons.js';
import { COLLECTION_JSON } from '@genshin/collection-json';
import { getWeaponById } from '@genshin/game-data';
import {
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
  isValidRefinementLevel,
  type UUID,
} from '@genshin/types';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const weapons = new Hono<{ Variables: AuthVariables }>();

weapons.use('*', auth);

interface CreateWeaponBody {
  refinementLevel?: unknown;
}

interface UpdateWeaponBody {
  refinementLevel?: unknown;
}

// GET /api/weapons — List all weapon instances as a flat collection
weapons.get('/', async (c) => {
  const userId = c.get('user').uid;
  const items = await listWeapons(userId);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponListDocument(items, baseUrl)), {
    headers: { 'Content-Type': COLLECTION_JSON },
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
    headers: { 'Content-Type': COLLECTION_JSON },
  });
});

// POST /api/weapons/:weaponId — Create new weapon instance
weapons.post('/:weaponId', async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();

  // Verify weaponId exists in game data
  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  let body: CreateWeaponBody;
  try {
    body = await c.req.json<CreateWeaponBody>();
  } catch {
    throw new HTTPException(400, { message: 'Invalid or missing JSON body' });
  }

  const { refinementLevel } = body;

  if (!isValidRefinementLevel(refinementLevel)) {
    throw new HTTPException(400, {
      message: `refinementLevel must be an integer between ${MIN_REFINEMENT_LEVEL} and ${MAX_REFINEMENT_LEVEL}`,
    });
  }

  const weapon = await createWeaponInstance(userId, weaponId, refinementLevel);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponItemDocument(weapon, baseUrl)), {
    status: 201,
    headers: { 'Content-Type': COLLECTION_JSON },
  });
});

// PUT /api/weapons/:weaponId/:weaponInstanceId — Update weapon instance
weapons.put('/:weaponId/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  let body: UpdateWeaponBody;
  try {
    body = await c.req.json<UpdateWeaponBody>();
  } catch {
    throw new HTTPException(400, { message: 'Invalid or missing JSON body' });
  }

  const { refinementLevel } = body;

  if (!isValidRefinementLevel(refinementLevel)) {
    throw new HTTPException(400, {
      message: `refinementLevel must be an integer between ${MIN_REFINEMENT_LEVEL} and ${MAX_REFINEMENT_LEVEL}`,
    });
  }

  const weapon = await updateWeaponInstance(userId, weaponId, weaponInstanceId, refinementLevel);

  if (!weapon) {
    throw new HTTPException(404, { message: 'Weapon instance not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponItemDocument(weapon, baseUrl)), {
    headers: { 'Content-Type': COLLECTION_JSON },
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
