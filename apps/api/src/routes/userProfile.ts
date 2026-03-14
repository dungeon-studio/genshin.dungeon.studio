// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthVariables } from '@/middleware/auth.js';
import { auth } from '@/middleware/auth.js';
import type { NegotiatedContentVariables } from '@/middleware/negotiate-content.js';
import { negotiateContent } from '@/middleware/negotiate-content.js';
import type { ValidatedBodyVariables } from '@/middleware/validate-body.js';
import { validateBody } from '@/middleware/validate-body.js';
import { getProfile, updateProfile } from '@/repositories/profile/index.js';
import profilePatchSchema from '@/schemas/profile/patch/1.0.0.json' with { type: 'json' };
import type { ProfileUpdate, UserProfile } from '@genshin/types';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

export const userProfile = new Hono<{
  Variables: AuthVariables & NegotiatedContentVariables & ValidatedBodyVariables;
}>();

const GET_SCHEMA_PATH = '/schemas/profile/get/1.0.0.json';

userProfile.use('*', auth);
userProfile.use(
  '*',
  negotiateContent([{ mediaType: 'application/json', profilePath: GET_SCHEMA_PATH }]),
);

// The profile response is a composite of two ownership domains:
//
//   Auth-owned (read-only, from verified token): uid, email, emailVerified, picture
//   Profile-owned (mutable via PATCH, from Firestore): name, createdAt, updatedAt
//
// Cherry-pick identity fields rather than spreading the full DecodedIdToken.
// The token carries ~15 internal JWT fields (iss, aud, exp, firebase metadata,
// custom claims) that are not part of the API contract and would make the
// response shape unpredictable.
function compositeResponse(decoded: DecodedIdToken, profile: UserProfile) {
  return {
    // Auth-owned — sourced from the verified Firebase ID token
    uid: decoded.uid,
    email: decoded.email ?? null,
    emailVerified: decoded.email_verified ?? false,
    picture: decoded.picture ?? null,
    // Profile-owned — sourced from Firestore, mutable via PATCH
    ...profile,
  };
}

// GET /api/profile — Return the authenticated user's composite profile
userProfile.get('/', async (c) => {
  const decoded = c.get('user');
  const profile = await getProfile(decoded.uid);

  if (!profile) {
    throw new HTTPException(404, { message: 'Profile not found' });
  }

  return c.json(compositeResponse(decoded, profile), 200, {
    'Content-Type': c.get('negotiatedMediaType'),
  });
});

// PATCH /api/profile — Partial update of mutable profile fields
userProfile.patch('/', validateBody(profilePatchSchema), async (c) => {
  const decoded = c.get('user');
  const body = c.get('validatedBody') as ProfileUpdate;
  const updated = await updateProfile(decoded.uid, body);

  return c.json(compositeResponse(decoded, updated), 200, {
    'Content-Type': c.get('negotiatedMediaType'),
  });
});
