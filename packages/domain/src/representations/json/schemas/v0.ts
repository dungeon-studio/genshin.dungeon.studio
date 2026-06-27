// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

/**
 * Legacy profile response — emitted before schemaVersion stamping.
 *
 * Detected by the absence of a numeric schemaVersion field.
 */
export const V0ProfileResponseSchema = z.object({
  uid: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  picture: z.string().nullable().optional(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type V0ProfileResponse = z.infer<typeof V0ProfileResponseSchema>;

export const v0 = defineVersion({ initial: true, schema: V0ProfileResponseSchema });
