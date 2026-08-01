// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { z } from 'zod';

interface StoreSchemas {
  /** Zod schema for each persisted version, keyed by the version zustand stamps. */
  readonly versions: Readonly<Record<number, z.ZodType>>;
  /** The newest version the store can encounter in a browser. */
  readonly currentVersion: number;
}

/**
 * Every localStorage zustand store whose shape evolution is gated.
 *
 * Keyed by the `persist` store name. The schema is the per-record entry, not the
 * whole-store blob: a collection keys entries under a `Record`, and jsoncompat
 * can't see into a `Record` value, so snapshotting the wrapper would leave the
 * entry fields ungated. This mirrors the api side, which snapshots one Firestore
 * document rather than the collection.
 *
 * Empty because the web app currently persists nothing: `genshin-collection`
 * was the sole entry and went away with anonymous collection management. Add a
 * store here as soon as it gains `persist`, before it can ship a shape.
 */
export const SCHEMA_REGISTRY: Record<string, StoreSchemas> = {};

/** Render a schema as the canonical JSON Schema snapshot string (trailing newline included). */
export function toSnapshot(schema: z.ZodType): string {
  return `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
}
