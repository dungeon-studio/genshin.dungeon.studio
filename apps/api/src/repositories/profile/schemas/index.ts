// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { createVersionedEntity, type InferredEntity } from 'verzod';

import { v0 } from './v0.js';
import { v1 } from './v1.js';

export { type V0Profile } from './v0.js';

export const CURRENT_VERSION = 1 as const;

export const entity = createVersionedEntity({
  latestVersion: CURRENT_VERSION,
  versionMap: { 0: v0, 1: v1 },
  getVersion(data: unknown) {
    if (typeof data !== 'object' || data === null) return null;
    const ver = (data as Record<string, unknown>).schemaVersion;
    return typeof ver === 'number' ? ver : 0;
  },
});

export type V1Profile = InferredEntity<typeof entity>;
