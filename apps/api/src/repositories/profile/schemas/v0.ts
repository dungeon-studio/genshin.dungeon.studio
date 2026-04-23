// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineVersion } from 'verzod';
import { z } from 'zod';

export const V0ProfileSchema = z.object({
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type V0Profile = z.infer<typeof V0ProfileSchema>;

export const v0 = defineVersion({ initial: true, schema: V0ProfileSchema });
