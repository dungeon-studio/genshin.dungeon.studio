// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V0Weapon } from './v0.js';

export const V1WeaponSchema = z.object({
  schemaVersion: z.literal(1),
  weaponId: z.string(),
  refinementLevel: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const v1 = defineVersion({
  initial: false,
  schema: V1WeaponSchema,
  up: (old: V0Weapon): z.infer<typeof V1WeaponSchema> => ({
    schemaVersion: 1,
    weaponId: old.weaponId,
    refinementLevel: old.refinementLevel,
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  }),
});
