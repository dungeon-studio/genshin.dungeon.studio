// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

import { CURRENT_VERSION as collectionCurrent } from '../src/features/collection/characters/schemas/index.js';
import { V1CollectionCharacterSchema } from '../src/features/collection/characters/schemas/v1.js';

interface StoreSchemas {
  /** Zod schema for each persisted version, keyed by the version zustand stamps. */
  readonly versions: Readonly<Record<number, z.ZodType>>;
  /** The version `persist` writes onto every new snapshot. */
  readonly currentVersion: number;
}

/**
 * Every localStorage-persisted zustand store whose shape evolution is gated.
 *
 * Keyed by the `persist` store name. The schema is the per-record entry, not the
 * whole-store blob: the collection keys entries under a `Record`, and jsoncompat
 * can't see into a `Record` value, so snapshotting the wrapper would leave the
 * entry fields ungated. This mirrors the api side, which snapshots one Firestore
 * document rather than the collection.
 */
export const SCHEMA_REGISTRY: Record<string, StoreSchemas> = {
  'genshin-collection': {
    versions: { 1: V1CollectionCharacterSchema },
    currentVersion: collectionCurrent,
  },
};

/** Render a schema as the canonical JSON Schema snapshot string (trailing newline included). */
export function toSnapshot(schema: z.ZodType): string {
  return `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
}
