// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V1Team } from './v1.js';

export const V2MemberSchema = z.object({
  characterId: z.string(),
  collectionWeaponId: z.string().optional(),
  artifactPlan: z
    .object({
      sands: z.string().optional(),
      goblet: z.string().optional(),
      circlet: z.string().optional(),
      sets: z.array(z.string()).optional(),
      priorityMinorAffixes: z.array(z.string()).optional(),
      secondaryMinorAffixes: z.array(z.string()).optional(),
    })
    .optional(),
});

export type V2Member = z.infer<typeof V2MemberSchema>;

export const V2TeamSchema = z.object({
  schemaVersion: z.literal(2),
  name: z.string(),
  members: z.array(z.union([z.null(), V2MemberSchema])).max(MAX_TEAM_MEMBERS),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const v2 = defineVersion({
  initial: false,
  schema: V2TeamSchema,
  up: (old: V1Team): z.infer<typeof V2TeamSchema> => ({
    schemaVersion: 2,
    name: old.name,
    members: old.members.map((m): z.infer<typeof V2MemberSchema> | null => {
      if (m === null) return null;
      const { weaponInstanceId, ...rest } = m;
      return {
        ...rest,
        ...(weaponInstanceId !== undefined ? { collectionWeaponId: weaponInstanceId } : {}),
      };
    }),
    ...(old.description !== undefined ? { description: old.description } : {}),
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  }),
});
