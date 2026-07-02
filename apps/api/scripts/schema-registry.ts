// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

import { CURRENT_VERSION as charactersCurrent } from '../src/repositories/characters/schemas/index.js';
import { V0CharacterSchema } from '../src/repositories/characters/schemas/v0.js';
import { V1CharacterSchema } from '../src/repositories/characters/schemas/v1.js';
import { CURRENT_VERSION as teamsCurrent } from '../src/repositories/teams/schemas/index.js';
import { V0TeamSchema } from '../src/repositories/teams/schemas/v0.js';
import { V1TeamSchema } from '../src/repositories/teams/schemas/v1.js';
import { CURRENT_VERSION as weaponsCurrent } from '../src/repositories/weapons/schemas/index.js';
import { V0WeaponSchema } from '../src/repositories/weapons/schemas/v0.js';
import { V1WeaponSchema } from '../src/repositories/weapons/schemas/v1.js';

interface RepositorySchemas {
  /** Zod schema for each version, indexed by version number (`versions[0]` is v0). */
  readonly versions: readonly z.ZodType[];
  /** The version the writer stamps onto every new document. */
  readonly currentVersion: number;
}

/**
 * Every Firestore document repository whose schema evolution is gated.
 *
 * The user-profile repository is intentionally absent: it is slated for removal
 * (see PR #879) and has no surviving consumer to protect.
 */
export const SCHEMA_REGISTRY: Record<string, RepositorySchemas> = {
  characters: {
    versions: [V0CharacterSchema, V1CharacterSchema],
    currentVersion: charactersCurrent,
  },
  teams: { versions: [V0TeamSchema, V1TeamSchema], currentVersion: teamsCurrent },
  weapons: { versions: [V0WeaponSchema, V1WeaponSchema], currentVersion: weaponsCurrent },
};

/** Render a schema as the canonical JSON Schema snapshot string (trailing newline included). */
export function toSnapshot(schema: z.ZodType): string {
  return `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
}
