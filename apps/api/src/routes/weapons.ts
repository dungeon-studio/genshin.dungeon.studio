// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { ValidatedBodyVariables } from '@/middleware/validate-body.js';
import { validateBody } from '@/middleware/validate-body.js';
import {
  createWeapon,
  deleteWeapon,
  getWeapon,
  listWeapons,
  updateWeapon,
} from '@/repositories/weapons/index.js';
import {
  weaponItemDocument,
  weaponItemHref,
  weaponListDocument,
} from '@/representations/collection-json/weapons.js';
import { weaponPatchRequestV1 } from '@/schemas/weapons/patch-request-v1.js';
import { weaponPostRequestV1 } from '@/schemas/weapons/post-request-v1.js';
import { COLLECTION_JSON } from '@genshin/collection-json';
import { getWeaponById } from '@genshin/game-data';
import type { UUID } from '@genshin/types';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const weapons = new Hono<{ Variables: AuthVariables & ValidatedBodyVariables }>();

weapons.use('*', auth);

const PROFILE_PATH = '/profiles/weapons/1.0.0.json';

interface CreateWeaponBody {
  weaponId: string;
  refinementLevel: number;
}

interface UpdateWeaponBody {
  refinementLevel: number;
}

// GET /api/weapons — List all weapon instances, optionally filtered by weaponId
weapons.get('/', async (c) => {
  const userId = c.get('user').uid;
  const weaponId = c.req.query('weaponId');
  const baseUrl = new URL(c.req.url).origin;

  if (weaponId !== undefined) {
    if (!weaponId) {
      throw new HTTPException(400, { message: 'weaponId query parameter must not be empty' });
    }

    if (!getWeaponById(weaponId)) {
      throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
    }

    const instances = await listWeapons(userId, weaponId);

    return c.body(JSON.stringify(weaponListDocument(instances, baseUrl)), {
      headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
    });
  }

  const items = await listWeapons(userId);

  return c.body(JSON.stringify(weaponListDocument(items, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// POST /api/weapons — Create new weapon instance
weapons.post('/', validateBody(weaponPostRequestV1.schema), async (c) => {
  const userId = c.get('user').uid;
  const { weaponId, refinementLevel } = c.get('validatedBody') as CreateWeaponBody;

  if (!getWeaponById(weaponId)) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }

  const weapon = await createWeapon(userId, weaponId, refinementLevel);
  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponListDocument([weapon], baseUrl)), {
    status: 201,
    headers: {
      'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"`,
      Location: weaponItemHref(baseUrl, weapon),
    },
  });
});

// GET /api/weapons/:weaponInstanceId — Get single weapon instance
weapons.get('/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  const weapon = await getWeapon(userId, weaponInstanceId);

  if (!weapon) {
    throw new HTTPException(404, { message: 'Weapon instance not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponItemDocument(weapon, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// PATCH /api/weapons/:weaponInstanceId — Update weapon instance
weapons.patch('/:weaponInstanceId', validateBody(weaponPatchRequestV1.schema), async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  const { refinementLevel } = c.get('validatedBody') as UpdateWeaponBody;

  const weapon = await updateWeapon(userId, weaponInstanceId, refinementLevel);

  if (!weapon) {
    throw new HTTPException(404, { message: 'Weapon instance not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(JSON.stringify(weaponItemDocument(weapon, baseUrl)), {
    headers: { 'Content-Type': `${COLLECTION_JSON}; profile="${baseUrl}${PROFILE_PATH}"` },
  });
});

// DELETE /api/weapons/:weaponInstanceId — Delete weapon instance
weapons.delete('/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  await deleteWeapon(userId, weaponInstanceId);

  return c.body(null, 204);
});
