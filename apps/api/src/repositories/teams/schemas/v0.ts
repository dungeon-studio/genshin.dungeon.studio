// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { defineVersion } from 'verzod';
import { z } from 'zod';

export const V0MemberSchema = z.object({
  characterId: z.string(),
  weaponInstanceId: z.string().optional(),
  artifactPlan: z
    .object({
      sands: z.string().optional(),
      goblet: z.string().optional(),
      circlet: z.string().optional(),
      sets: z.array(z.string()).optional(),
      primaryStats: z.array(z.string()).optional(),
      secondaryStats: z.array(z.string()).optional(),
      priorityMinorAffixes: z.array(z.string()).optional(),
      secondaryMinorAffixes: z.array(z.string()).optional(),
    })
    .optional(),
});

export const V0TeamSchema = z.object({
  name: z.string(),
  members: z.array(z.union([z.null(), V0MemberSchema])).max(MAX_TEAM_MEMBERS),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type V0Team = z.infer<typeof V0TeamSchema>;

export const v0 = defineVersion({ initial: true, schema: V0TeamSchema });
