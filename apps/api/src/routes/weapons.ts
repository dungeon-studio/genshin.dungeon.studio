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

// GET /api/weapons — List all weapon instances grouped by weaponId
weapons.get('/', async (c) => {
  const userId = c.get('user').uid;
  const grouped = await listWeapons(userId);

  return c.json(grouped);
});

// GET /api/weapons/:weaponId — List instances of specific weapon
weapons.get('/:weaponId', async (c) => {
  const userId = c.get('user').uid;
  const { weaponId } = c.req.param();

  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  const instances = await listWeaponInstances(userId, weaponId);

  return c.json(instances);
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

  return c.json(weapon, 201);
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

  return c.json(weapon);
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
