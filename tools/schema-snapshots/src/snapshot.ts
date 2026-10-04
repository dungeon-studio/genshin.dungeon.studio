// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { z } from 'zod';

/** One persisted shape's schema history. */
export interface VersionedSchemas {
  /** Zod schema for each version, keyed by the version number stamped on stored data. */
  readonly versions: Readonly<Record<number, z.ZodType>>;
  /** The version the writer stamps onto everything it persists. */
  readonly currentVersion: number;
}

/**
 * Every persisted shape a package gates, keyed by the name its snapshots are
 * filed under: `schema-snapshots/{name}/v{n}.json`.
 *
 * Snapshot the stored unit, not its container. jsoncompat can't descend into
 * `additionalProperties`, so a store keyed by a `Record` must register the
 * per-record entry schema, or the entry fields go ungated.
 */
export type SchemaRegistry = Readonly<Record<string, VersionedSchemas>>;

/** Render a schema as the canonical JSON Schema snapshot string (trailing newline included). */
export function toSnapshot(schema: z.ZodType): string {
  return `${JSON.stringify(z.toJSONSchema(schema), null, 2)}\n`;
}

/**
 * Write `{dir}/{name}/v{n}.json` for every registered version.
 *
 * Throws before writing anything when a `currentVersion` isn't the newest
 * defined schema: the writer would stamp data with a version the reader can't
 * resolve.
 */
export function exportSnapshots(registry: SchemaRegistry, dir: string): void {
  for (const [name, { versions, currentVersion }] of Object.entries(registry)) {
    const latest = Math.max(...Object.keys(versions).map(Number));
    if (currentVersion !== latest) {
      throw new Error(
        `${name}: CURRENT_VERSION is ${String(currentVersion)} but the latest defined schema is v${String(latest)}.`,
      );
    }
  }

  for (const [name, { versions }] of Object.entries(registry)) {
    mkdirSync(join(dir, name), { recursive: true });
    for (const [version, schema] of Object.entries(versions)) {
      writeFileSync(join(dir, name, `v${version}.json`), toSnapshot(schema));
    }
  }
}
