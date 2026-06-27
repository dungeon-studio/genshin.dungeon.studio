// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V0ProfileResponse } from './v0.js';

/**
 * Profile response with an explicit schemaVersion stamp.
 *
 * The composite of auth-owned (read-only) and profile-owned (mutable)
 * fields. Matches the shape returned by GET /api/profile and the JSON
 * Schema in schemas/profile/get-response-v1.
 */
export const V1ProfileResponseSchema = z.object({
  schemaVersion: z.literal(1),
  uid: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  picture: z.string().nullable().optional(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const v1 = defineVersion({
  initial: false,
  schema: V1ProfileResponseSchema,
  up: (old: V0ProfileResponse): z.infer<typeof V1ProfileResponseSchema> => ({
    schemaVersion: 1,
    ...old,
  }),
});
