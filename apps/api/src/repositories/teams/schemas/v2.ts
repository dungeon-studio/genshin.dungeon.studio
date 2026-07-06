// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V1Team } from './v1.js';

export const V2MemberSchema = z.object({
  characterId: z.string(),
  weaponInstanceId: z.string().optional(),
  artifactPlan: z
    .object({
      sands: z.string().optional(),
      goblet: z.string().optional(),
      circlet: z.string().optional(),
      primarySetId: z.string().optional(),
      secondarySetId: z.string().optional(),
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
      if (!m.artifactPlan) {
        return {
          characterId: m.characterId,
          ...(m.weaponInstanceId !== undefined ? { weaponInstanceId: m.weaponInstanceId } : {}),
        };
      }
      const { sands, goblet, circlet, sets, priorityMinorAffixes, secondaryMinorAffixes } =
        m.artifactPlan;
      return {
        characterId: m.characterId,
        ...(m.weaponInstanceId !== undefined ? { weaponInstanceId: m.weaponInstanceId } : {}),
        artifactPlan: {
          ...(sands !== undefined ? { sands } : {}),
          ...(goblet !== undefined ? { goblet } : {}),
          ...(circlet !== undefined ? { circlet } : {}),
          ...(sets?.[0] !== undefined ? { primarySetId: sets[0] } : {}),
          ...(sets?.[1] !== undefined ? { secondarySetId: sets[1] } : {}),
          ...(priorityMinorAffixes !== undefined ? { priorityMinorAffixes } : {}),
          ...(secondaryMinorAffixes !== undefined ? { secondaryMinorAffixes } : {}),
        },
      };
    }),
    ...(old.description !== undefined ? { description: old.description } : {}),
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  }),
});
