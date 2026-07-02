// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Regenerates the committed JSON Schema snapshots from the Zod source of truth.
// Run via `turbo run schemas:export` so workspace dependencies are built first.
// The pre-commit `schema-snapshots` hook fails the commit when a regenerated
// snapshot differs from what is checked in, keeping the snapshots faithful to
// the schemas they mirror.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHEMA_REGISTRY, toSnapshot } from './schema-registry.js';

const snapshotDir = fileURLToPath(new URL('../schema-snapshots', import.meta.url));

// Validate the registry before writing anything: CURRENT_VERSION must point at
// the newest defined schema, or the writer would stamp documents with a version
// the reader can't resolve. Kept here (over the compat check) because export is
// the only script that imports the Zod source this asserts against.
for (const [repository, { versions, currentVersion }] of Object.entries(SCHEMA_REGISTRY)) {
  if (currentVersion !== versions.length - 1) {
    throw new Error(
      `${repository}: CURRENT_VERSION is ${String(currentVersion)} but the latest defined schema is v${String(versions.length - 1)}.`,
    );
  }
}

for (const [repository, { versions }] of Object.entries(SCHEMA_REGISTRY)) {
  versions.forEach((schema, version) => {
    const file = join(snapshotDir, repository, `v${version}.json`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, toSnapshot(schema));
  });
}
