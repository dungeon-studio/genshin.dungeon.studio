// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Schema evolution gate for persisted shapes.
 *
 * To gate a package's schemas: list them in a `scripts/schema-registry.ts`
 * exporting a {@link SchemaRegistry}, add a `schemas:export` script that passes
 * it to {@link exportSnapshots} with the package's `schema-snapshots/`
 * directory, and commit what it writes. The drift hook and the compatibility
 * check pick the package up from there.
 *
 * @packageDocumentation
 */

export { checkSnapshotCompat } from './compat.js';
export { exportSnapshots, toSnapshot } from './snapshot.js';
export type { SchemaRegistry, VersionedSchemas } from './snapshot.js';
