// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

export const V0WeaponSchema = z.object({
  weaponId: z.string(),
  refinementLevel: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type V0Weapon = z.infer<typeof V0WeaponSchema>;

export const v0 = defineVersion({ initial: true, schema: V0WeaponSchema });
