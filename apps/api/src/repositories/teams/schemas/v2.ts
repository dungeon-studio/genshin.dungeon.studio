// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { defineVersion } from 'verzod';
import { z } from 'zod';

import { type V1Member, type V1Team } from './v1.js';

const V2MemberSchema = z.object({
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

type V1ArtifactPlan = NonNullable<V1Member['artifactPlan']>;
type V2ArtifactPlan = NonNullable<V2Member['artifactPlan']>;

/** Splits `sets` across the named fields; every other field carries through. */
function migrateArtifactPlan({ sets, ...carried }: V1ArtifactPlan): V2ArtifactPlan {
  return {
    ...carried,
    // v1 typed `sets` as an unbounded array, so a hand-edited document can carry
    // more than the two the domain ever accepted. Anything past the second entry
    // is dropped rather than failing the read.
    ...(sets?.[0] !== undefined ? { primarySetId: sets[0] } : {}),
    ...(sets?.[1] !== undefined ? { secondarySetId: sets[1] } : {}),
  };
}

function migrateMember(member: V1Member): V2Member {
  const { artifactPlan, ...carried } = member;
  return {
    ...carried,
    ...(artifactPlan !== undefined ? { artifactPlan: migrateArtifactPlan(artifactPlan) } : {}),
  };
}

export const v2 = defineVersion({
  initial: false,
  schema: V2TeamSchema,
  up: (old: V1Team): z.infer<typeof V2TeamSchema> => ({
    ...old,
    schemaVersion: 2,
    members: old.members.map((member) => (member === null ? null : migrateMember(member))),
  }),
});
