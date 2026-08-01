// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { COLLECTION_JSON, serialiseCollection } from '@genshin/collection-json';
import type { CollectionWeapon, UUID } from '@genshin/domain';
import { isUUID, serialiseWeapon, weaponItemHref, weaponRepresentation } from '@genshin/domain';
import { getWeaponById } from '@genshin/game-data';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { FromSchema } from 'json-schema-to-ts';

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { NegotiatedResponseContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import type { NegotiatedRequestSchemaVariables } from '@/middleware/negotiate-request-schema.js';
import { negotiateRequestSchema } from '@/middleware/negotiate-request-schema.js';
import type { ValidatedRequestBodyVariables } from '@/middleware/validate-request-body.js';
import { validateRequestBody } from '@/middleware/validate-request-body.js';
import { weaponItemV1 } from '@/profiles/alps/weapon/item-v1.js';
import { weaponPatchRequestV1 } from '@/profiles/json-schema/weapons/patch-request-v1.js';
import { weaponPostRequestV1 } from '@/profiles/json-schema/weapons/post-request-v1.js';
import { weaponPutRequestV1 } from '@/profiles/json-schema/weapons/put-request-v1.js';
import * as Weapons from '@/repositories/weapons/index.js';

export const weapons = new Hono<{
  Variables: AuthVariables &
    NegotiatedResponseContentVariables &
    NegotiatedRequestSchemaVariables &
    ValidatedRequestBodyVariables;
}>();

weapons.use('*', auth);

weapons.use('*', negotiateContent([{ mediaType: COLLECTION_JSON, profile: weaponItemV1 }]));

type CreateWeaponBody = FromSchema<typeof weaponPostRequestV1.schema>;
type SaveWeaponBody = FromSchema<typeof weaponPutRequestV1.schema>;
type UpdateWeaponBody = FromSchema<typeof weaponPatchRequestV1.schema>;

/** Every single-instance response body; only the href and status differ. */
function weaponBody(weapon: CollectionWeapon, baseUrl: string, href: string): string {
  return JSON.stringify(
    serialiseCollection(weaponRepresentation, href, [serialiseWeapon(weapon, baseUrl)]),
  );
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

    const instances = await Weapons.list(userId, weaponId);

    return c.body(
      JSON.stringify(
        serialiseCollection(
          weaponRepresentation,
          `${baseUrl}/api/weapons?weaponId=${encodeURIComponent(weaponId)}`,
          instances.map((w) => serialiseWeapon(w, baseUrl)),
        ),
      ),
      {
        headers: { 'Content-Type': c.get('negotiatedMediaType') },
      },
    );
  }

  const items = await Weapons.list(userId);

  return c.body(
    JSON.stringify(
      serialiseCollection(
        weaponRepresentation,
        `${baseUrl}/api/weapons`,
        items.map((w) => serialiseWeapon(w, baseUrl)),
      ),
    ),
    {
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    },
  );
});

// POST /api/weapons — Create new weapon instance
weapons.post(
  '/',
  negotiateRequestSchema([weaponPostRequestV1]),
  validateRequestBody([weaponPostRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const { weaponId, refinementLevel } = c.get('validatedBody') as CreateWeaponBody;

    if (!getWeaponById(weaponId)) {
      throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
    }

    const weapon = await Weapons.create(userId, weaponId, refinementLevel);
    const baseUrl = new URL(c.req.url).origin;

    return c.body(weaponBody(weapon, baseUrl, `${baseUrl}/api/weapons`), {
      status: 201,
      headers: {
        'Content-Type': c.get('negotiatedMediaType'),
        Location: weaponItemHref(baseUrl, weapon),
      },
    });
  },
);

// GET /api/weapons/:weaponInstanceId — Get single weapon instance
weapons.get('/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  const weapon = await Weapons.get(userId, weaponInstanceId);

  if (!weapon) {
    throw new HTTPException(404, { message: 'Weapon instance not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return c.body(weaponBody(weapon, baseUrl, weaponItemHref(baseUrl, weapon)), {
    headers: { 'Content-Type': c.get('negotiatedMediaType') },
  });
});

// PUT /api/weapons/:weaponInstanceId — Save weapon instance at a caller-chosen id
// (idempotent upsert)
weapons.put(
  '/:weaponInstanceId',
  negotiateRequestSchema([weaponPutRequestV1]),
  validateRequestBody([weaponPutRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const weaponInstanceId = c.req.param('weaponInstanceId');

    // The identifier names a Firestore document, and here it comes from the
    // client rather than from randomUUID(), so it has to be checked.
    if (!isUUID(weaponInstanceId)) {
      throw new HTTPException(400, {
        message: `Weapon instance identifier must be a UUID: ${weaponInstanceId}`,
      });
    }

    const { weaponId, refinementLevel } = c.get('validatedBody') as SaveWeaponBody;

    if (!getWeaponById(weaponId)) {
      throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
    }

    const { weapon, created } = await Weapons.save(
      userId,
      weaponInstanceId,
      weaponId,
      refinementLevel,
    );
    const baseUrl = new URL(c.req.url).origin;

    return c.body(weaponBody(weapon, baseUrl, weaponItemHref(baseUrl, weapon)), {
      status: created ? 201 : 200,
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    });
  },
);

// PATCH /api/weapons/:weaponInstanceId — Update weapon instance
weapons.patch(
  '/:weaponInstanceId',
  negotiateRequestSchema([weaponPatchRequestV1]),
  validateRequestBody([weaponPatchRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

    const { refinementLevel } = c.get('validatedBody') as UpdateWeaponBody;

    const weapon = await Weapons.update(userId, weaponInstanceId, refinementLevel);

    if (!weapon) {
      throw new HTTPException(404, { message: 'Weapon instance not found' });
    }

    const baseUrl = new URL(c.req.url).origin;

    return c.body(weaponBody(weapon, baseUrl, weaponItemHref(baseUrl, weapon)), {
      headers: { 'Content-Type': c.get('negotiatedMediaType') },
    });
  },
);

// DELETE /api/weapons/:weaponInstanceId — Delete weapon instance
weapons.delete('/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  await Weapons.remove(userId, weaponInstanceId);

  return c.body(null, 204);
});
