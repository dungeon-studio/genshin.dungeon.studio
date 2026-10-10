// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { COLLECTION_JSON } from '@genshin/collection-json';
import type { RefinementLevel, UUID } from '@genshin/domain';
import {
  weaponItemDocument,
  weaponItemHref,
  weaponListDocument,
  weaponsOfDocument,
} from '@genshin/domain';
import type { WeaponId } from '@genshin/game-data';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { FromSchema } from 'json-schema-to-ts';

import { requireWeaponId } from '@/catalogue.js';
import { negotiatedJson } from '@/http/negotiated-response.js';
import { linkNextPage, parsePageRequest } from '@/http/page.js';
import { auth } from '@/middleware/auth.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import { negotiateRequestSchema } from '@/middleware/negotiate-request-schema.js';
import { validateRequestBody } from '@/middleware/validate-request-body.js';
import { weaponItemV1 } from '@/profiles/alps/weapon/item-v1.js';
import { weaponPatchRequestV1 } from '@/profiles/json-schema/weapons/patch-request-v1.js';
import { weaponPostRequestV1 } from '@/profiles/json-schema/weapons/post-request-v1.js';
import * as Weapons from '@/repositories/weapons/index.js';
import type { AuthenticatedRouteVariables } from '@/routes/variables.js';

/**
 * The signed-in caller's owned weapon instances, addressed by an identifier the
 * server mints.
 *
 * A user can own several copies of one weapon at different refinements, so
 * creation is `POST` and the response carries `Location`. The collection takes
 * a `weaponId` query to narrow to one weapon's copies.
 */
export const weapons = new Hono<{
  Variables: AuthenticatedRouteVariables;
}>();

weapons.use('*', auth);

weapons.use('*', negotiateContent([{ mediaType: COLLECTION_JSON, profile: weaponItemV1 }]));

type CreateWeaponBody = FromSchema<typeof weaponPostRequestV1.schema> & {
  refinementLevel: RefinementLevel;
};
type UpdateWeaponBody = FromSchema<typeof weaponPatchRequestV1.schema> & {
  refinementLevel: RefinementLevel;
};

function parseWeaponFilter(weaponId: string | undefined): WeaponId | undefined {
  if (weaponId === undefined) {
    return undefined;
  }
  if (!weaponId) {
    throw new HTTPException(400, { message: 'weaponId query parameter must not be empty' });
  }

  return requireWeaponId(weaponId);
}

// GET /weapons — List a page of weapon instances, optionally filtered by weaponId
weapons.get('/', async (c) => {
  const userId = c.get('user').uid;
  const filter = parseWeaponFilter(c.req.query('weaponId'));
  const baseUrl = new URL(c.req.url).origin;

  const page = await Weapons.list(userId, parsePageRequest(c), filter);
  const document =
    filter === undefined
      ? weaponListDocument(page.items, baseUrl)
      : weaponsOfDocument(filter, page.items, baseUrl);

  return negotiatedJson(c, linkNextPage(c, page, document));
});

// POST /weapons — Create new weapon instance
weapons.post(
  '/',
  negotiateRequestSchema([weaponPostRequestV1]),
  validateRequestBody<[typeof weaponPostRequestV1], CreateWeaponBody>([weaponPostRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const { weaponId, refinementLevel } = c.get('validatedBody');

    const weapon = await Weapons.create(userId, requireWeaponId(weaponId), refinementLevel);
    const baseUrl = new URL(c.req.url).origin;

    return negotiatedJson(c, weaponListDocument([weapon], baseUrl), 201, {
      Location: weaponItemHref(baseUrl, weapon),
    });
  },
);

// GET /weapons/:weaponInstanceId — Get single weapon instance
weapons.get('/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  const weapon = await Weapons.get(userId, weaponInstanceId);

  if (!weapon) {
    throw new HTTPException(404, { message: 'Weapon instance not found' });
  }

  const baseUrl = new URL(c.req.url).origin;

  return negotiatedJson(c, weaponItemDocument(weapon, baseUrl));
});

// PATCH /weapons/:weaponInstanceId — Update weapon instance
weapons.patch(
  '/:weaponInstanceId',
  negotiateRequestSchema([weaponPatchRequestV1]),
  validateRequestBody<[typeof weaponPatchRequestV1], UpdateWeaponBody>([weaponPatchRequestV1]),
  async (c) => {
    const userId = c.get('user').uid;
    const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

    const { refinementLevel } = c.get('validatedBody');

    const weapon = await Weapons.update(userId, weaponInstanceId, refinementLevel);

    if (!weapon) {
      throw new HTTPException(404, { message: 'Weapon instance not found' });
    }

    const baseUrl = new URL(c.req.url).origin;

    return negotiatedJson(c, weaponItemDocument(weapon, baseUrl));
  },
);

// DELETE /weapons/:weaponInstanceId — Delete weapon instance
weapons.delete('/:weaponInstanceId', async (c) => {
  const userId = c.get('user').uid;
  const weaponInstanceId = c.req.param('weaponInstanceId') as UUID;

  await Weapons.remove(userId, weaponInstanceId);

  return c.body(null, 204);
});
