// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

export const V0CharacterSchema = z.object({
  constellationLevel: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type V0Character = z.infer<typeof V0CharacterSchema>;

export const v0 = defineVersion({ initial: true, schema: V0CharacterSchema });
