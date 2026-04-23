// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V0Team, V0MemberSchema } from './v0.js';

export const V1MemberSchema = z.object({
  characterId: z.string(),
  weaponInstanceId: z.string().optional(),
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

export type V1Member = z.infer<typeof V1MemberSchema>;

export const V1TeamSchema = z.object({
  schemaVersion: z.literal(1),
  name: z.string(),
  members: z.array(z.union([z.null(), V1MemberSchema])).max(MAX_TEAM_MEMBERS),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const v1 = defineVersion({
  initial: false,
  schema: V1TeamSchema,
  up: (old: V0Team): z.infer<typeof V1TeamSchema> => ({
    schemaVersion: 1,
    name: old.name,
    members: old.members.map((m): z.infer<typeof V1MemberSchema> | null => {
      if (m === null) return null;
      if (!m.artifactPlan) {
        return {
          characterId: m.characterId,
          ...(m.weaponInstanceId !== undefined ? { weaponInstanceId: m.weaponInstanceId } : {}),
        };
      }
      const {
        primaryStats,
        secondaryStats,
        sands,
        goblet,
        circlet,
        sets,
        priorityMinorAffixes,
        secondaryMinorAffixes,
      } = m.artifactPlan;
      return {
        characterId: m.characterId,
        ...(m.weaponInstanceId !== undefined ? { weaponInstanceId: m.weaponInstanceId } : {}),
        artifactPlan: {
          ...(sands !== undefined ? { sands } : {}),
          ...(goblet !== undefined ? { goblet } : {}),
          ...(circlet !== undefined ? { circlet } : {}),
          ...(sets !== undefined ? { sets } : {}),
          ...(primaryStats !== undefined
            ? { priorityMinorAffixes: primaryStats }
            : priorityMinorAffixes !== undefined
              ? { priorityMinorAffixes }
              : {}),
          ...(secondaryStats !== undefined
            ? { secondaryMinorAffixes: secondaryStats }
            : secondaryMinorAffixes !== undefined
              ? { secondaryMinorAffixes }
              : {}),
        },
      };
    }),
    ...(old.description !== undefined ? { description: old.description } : {}),
    createdAt: old.createdAt,
    updatedAt: old.updatedAt,
  }),
});

// V0MemberSchema re-exported so the map callback type is available without
// reaching into v0 directly from outside the schemas directory.
export { V0MemberSchema };
