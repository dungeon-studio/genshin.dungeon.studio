// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Regenerates the committed JSON Schema snapshots from their Zod source. Run via
// `turbo run schemas:export` so workspace dependencies build first; the
// schema-snapshots pre-commit hook fails when the checked-in snapshots drift.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { SCHEMA_REGISTRY, toSnapshot } from './schema-registry.js';

const snapshotDir = fileURLToPath(new URL('../schema-snapshots', import.meta.url));

// Validate before writing: CURRENT_VERSION must point at the newest defined
// schema, or the writer stamps documents with a version the reader can't resolve.
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
