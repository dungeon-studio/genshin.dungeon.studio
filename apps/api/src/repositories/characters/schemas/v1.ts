// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V0Character } from './v0.js';

export const V1CharacterSchema = z.object({
  schemaVersion: z.literal(1),
  constellationLevel: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const v1 = defineVersion({
  initial: false,
  schema: V1CharacterSchema,
  up: (old: V0Character): z.infer<typeof V1CharacterSchema> => ({
    schemaVersion: 1,
    constellationLevel: old.constellationLevel,
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  }),
});
