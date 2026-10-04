// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { SchemaRegistry } from '@genshin/schema-snapshots';

import { CURRENT_VERSION as charactersCurrent } from '../src/repositories/characters/schemas/index.js';
import { V0CharacterSchema } from '../src/repositories/characters/schemas/v0.js';
import { V1CharacterSchema } from '../src/repositories/characters/schemas/v1.js';
import { CURRENT_VERSION as teamsCurrent } from '../src/repositories/teams/schemas/index.js';
import { V0TeamSchema } from '../src/repositories/teams/schemas/v0.js';
import { V1TeamSchema } from '../src/repositories/teams/schemas/v1.js';
import { CURRENT_VERSION as weaponsCurrent } from '../src/repositories/weapons/schemas/index.js';
import { V0WeaponSchema } from '../src/repositories/weapons/schemas/v0.js';
import { V1WeaponSchema } from '../src/repositories/weapons/schemas/v1.js';

/** Every Firestore document repository whose schema evolution is gated. */
export const SCHEMA_REGISTRY: SchemaRegistry = {
  characters: {
    versions: { 0: V0CharacterSchema, 1: V1CharacterSchema },
    currentVersion: charactersCurrent,
  },
  teams: { versions: { 0: V0TeamSchema, 1: V1TeamSchema }, currentVersion: teamsCurrent },
  weapons: { versions: { 0: V0WeaponSchema, 1: V1WeaponSchema }, currentVersion: weaponsCurrent },
};
