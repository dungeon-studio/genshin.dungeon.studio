// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Regenerates the committed JSON Schema snapshots for the persisted zustand
// stores from their Zod source. Run via `turbo run schemas:export` so workspace
// dependencies build first; the schema-snapshots pre-commit hook fails when the
// checked-in snapshots drift.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHEMA_REGISTRY, toSnapshot } from './schema-registry.js';

const snapshotDir = fileURLToPath(new URL('../schema-snapshots', import.meta.url));

// Validate before writing: currentVersion must point at the newest defined
// schema, or `persist` stamps snapshots with a version `migrate` can't resolve.
for (const [store, { versions, currentVersion }] of Object.entries(SCHEMA_REGISTRY)) {
  const latest = Math.max(...Object.keys(versions).map(Number));
  if (currentVersion !== latest) {
    throw new Error(
      `${store}: CURRENT_VERSION is ${String(currentVersion)} but the latest defined schema is v${String(latest)}.`,
    );
  }
}

for (const [store, { versions }] of Object.entries(SCHEMA_REGISTRY)) {
  for (const [version, schema] of Object.entries(versions)) {
    const file = join(snapshotDir, store, `v${version}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, toSnapshot(schema));
  }
}
