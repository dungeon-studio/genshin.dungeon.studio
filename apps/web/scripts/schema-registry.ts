// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

import { CURRENT_VERSION as collectionCurrent } from '../src/features/collection/characters/schemas/index.js';
import { V1PersistedCollectionSchema } from '../src/features/collection/characters/schemas/v1.js';

interface StoreSchemas {
  /** Zod schema for each persisted version, keyed by the version zustand stamps. */
  readonly versions: Readonly<Record<number, z.ZodType>>;
  /** The version `persist` writes onto every new snapshot. */
  readonly currentVersion: number;
}

/**
 * Every localStorage-persisted zustand store whose shape evolution is gated.
 *
 * Keyed by the `persist` store name, so the snapshot path matches the key a
 * released build actually wrote to localStorage.
 */
export const SCHEMA_REGISTRY: Record<string, StoreSchemas> = {
  'genshin-collection': {
    versions: { 1: V1PersistedCollectionSchema },
    currentVersion: collectionCurrent,
  },
};

/** Render a schema as the canonical JSON Schema snapshot string (trailing newline included). */
export function toSnapshot(schema: z.ZodType): string {
  return `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
}
