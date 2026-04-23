// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V0Profile } from './v0.js';

export const V1ProfileSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const v1 = defineVersion({
  initial: false,
  schema: V1ProfileSchema,
  up: (old: V0Profile): z.infer<typeof V1ProfileSchema> => ({
    schemaVersion: 1,
    name: old.name,
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  }),
});
