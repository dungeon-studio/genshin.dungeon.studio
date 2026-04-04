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
import { profileGetResponseV1 } from '@/profiles/json-schema/profile/get-response-v1.js';
import { profilePatchRequestV1 } from '@/profiles/json-schema/profile/patch-request-v1.js';
import { getProfile, updateProfile } from '@/repositories/profile/index.js';
import { serialiseProfile, type AuthIdentity, type ProfileUpdate } from '@genshin/domain';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

function toAuthIdentity({ uid, email, email_verified, picture }: DecodedIdToken): AuthIdentity {
  return { uid, email, emailVerified: email_verified, picture };
}

export const userProfile = new Hono<{
  Variables: AuthVariables &
    NegotiatedContentVariables &
    NegotiatedRequestSchemaVariables &
    ValidatedRequestBodyVariables;
}>();

userProfile.use('*', auth);
userProfile.use(
  '*',
  negotiateContent([{ mediaType: 'application/json', profile: profileGetResponseV1 }]),
);

// Cherry-pick identity fields rather than spreading the full DecodedIdToken.
// The token carries ~15 internal JWT fields (iss, aud, exp, firebase metadata,
// custom claims) that are not part of the API contract and would make the
// response shape unpredictable. The shared serialiseProfile converter in
// @genshin/domain handles building the composite response from an AuthIdentity
// and a UserProfile.

// GET /api/profile — Return the authenticated user's composite profile
userProfile.get('/', async (c) => {
  const decoded = c.get('user');
  const profile = await getProfile(decoded.uid);

  if (!profile) {
    throw new HTTPException(404, { message: 'Profile not found' });
  }

  return c.json(serialiseProfile(toAuthIdentity(decoded), profile), 200, {
    'Content-Type': c.get('negotiatedMediaType'),
  });
});

// PATCH /api/profile — Partial update of mutable profile fields
userProfile.patch(
  '/',
  negotiateRequestSchema([profilePatchRequestV1]),
  validateRequestBody([profilePatchRequestV1]),
  async (c) => {
    const decoded = c.get('user');
    const body = c.get('validatedBody') as ProfileUpdate;
    const updated = await updateProfile(decoded.uid, body);

    return c.json(serialiseProfile(toAuthIdentity(decoded), updated), 200, {
      'Content-Type': c.get('negotiatedMediaType'),
    });
  },
);
