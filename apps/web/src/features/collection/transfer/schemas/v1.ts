// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { z } from 'zod';

// Timestamps are deliberately absent. `createdAt` and `updatedAt` are
// server-managed (see the field ownership table in
// docs/reference/rest-api-conventions.md) and no write endpoint accepts them, so
// carrying them would promise a fidelity import cannot deliver. The envelope
// holds exactly the fields an import can restore.
//
// Field validation stays loose here for the same reason the store schemas do:
// this gates structure, while the domain checks applied during import enforce
// semantics (known character, constellation range, refinement range).

export const V1TransferCharacterSchema = z.object({
  characterId: z.string(),
  constellationLevel: z.number(),
});

export const V1TransferWeaponSchema = z.object({
  weaponInstanceId: z.string(),
  weaponId: z.string(),
  refinementLevel: z.number(),
});

export const V1TransferMemberSchema = z.object({
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

export const V1TransferTeamSchema = z.object({
  slot: z.number(),
  name: z.string(),
  members: z.array(z.union([z.null(), V1TransferMemberSchema])).max(MAX_TEAM_MEMBERS),
  description: z.string().optional(),
});

export const V1TransferEnvelopeSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  characters: z.array(V1TransferCharacterSchema),
  weapons: z.array(V1TransferWeaponSchema),
  teams: z.array(V1TransferTeamSchema),
});

export type V1TransferEnvelope = z.infer<typeof V1TransferEnvelopeSchema>;
export type V1TransferCharacter = z.infer<typeof V1TransferCharacterSchema>;
export type V1TransferWeapon = z.infer<typeof V1TransferWeaponSchema>;
export type V1TransferTeam = z.infer<typeof V1TransferTeamSchema>;
