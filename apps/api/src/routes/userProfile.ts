// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { ValidatedBodyVariables } from '@/middleware/validate-body.js';
import { validateBody } from '@/middleware/validate-body.js';
import { getProfile, updateProfile } from '@/repositories/profile/index.js';
import profilePatchSchema from '@/schemas/profile/patch/1.0.0.json' with { type: 'json' };
import type { ProfileUpdate } from '@genshin/types';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const userProfile = new Hono<{ Variables: AuthVariables & ValidatedBodyVariables }>();

userProfile.use('*', auth);

const GET_SCHEMA_PATH = '/schemas/profile/get/1.0.0.json';

// GET /api/profile — Return the authenticated user's composite profile
userProfile.get('/', async (c) => {
  const decoded = c.get('user');
  const profile = await getProfile(decoded.uid);

  if (!profile) {
    throw new HTTPException(404, { message: 'Profile not found' });
  }

  return c.json(
    {
      uid: decoded.uid,
      email: decoded.email ?? null,
      email_verified: decoded.email_verified ?? false,
      picture: decoded.picture ?? null,
      ...profile,
    },
    200,
    {
      'Content-Type': `application/json; profile="${new URL(c.req.url).origin}${GET_SCHEMA_PATH}"`,
    },
  );
});

// PATCH /api/profile — Partial update of mutable profile fields
userProfile.patch('/', validateBody(profilePatchSchema), async (c) => {
  const userId = c.get('user').uid;
  const body = c.get('validatedBody') as ProfileUpdate;
  const updated = await updateProfile(userId, body);

  return c.json(updated, 200, {
    'Content-Type': `application/json; profile="${new URL(c.req.url).origin}${GET_SCHEMA_PATH}"`,
  });
});
