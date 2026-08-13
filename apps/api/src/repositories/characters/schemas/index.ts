// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createVersionedEntity, type InferredEntity } from 'verzod';

import { documentVersion } from '@/repositories/schema-version.js';

import { v0 } from './v0.js';
import { v1 } from './v1.js';

export { type V0Character } from './v0.js';

export const CURRENT_VERSION = 1 as const;

export const entity = createVersionedEntity({
  latestVersion: CURRENT_VERSION,
  versionMap: { 0: v0, 1: v1 },
  getVersion: documentVersion,
});

export type V1Character = InferredEntity<typeof entity>;
