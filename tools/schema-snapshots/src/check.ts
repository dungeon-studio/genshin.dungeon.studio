// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Proves a branch against its base, so it runs per pull request, not per commit.

import { checkSnapshotCompat } from './compat.js';
import { git } from './git.js';

/**
 * The git ref holding the last-shipped schemas: `SCHEMA_COMPAT_BASE` when set,
 * else `origin/develop`. A local `develop` can predate the snapshots and pass
 * vacuously. The `HEAD` fallback, for a clone with no remote, compares the
 * branch with itself and proves nothing.
 */
function resolveBaseRef(): string {
  const override = process.env.SCHEMA_COMPAT_BASE;
  if (override) return override;

  try {
    git(['rev-parse', '--verify', '--quiet', 'origin/develop']);
    return 'origin/develop';
  } catch {
    return 'HEAD';
  }
}

const baseRef = resolveBaseRef();
const violations = checkSnapshotCompat(git(['rev-parse', '--show-toplevel']).trim(), baseRef);

if (violations.length > 0) {
  console.error(`Schema compatibility check failed (base: ${baseRef}):\n`);
  for (const violation of violations) console.error(`  • ${violation}`);
  process.exit(1);
}

console.log(`Schema compatibility check passed (base: ${baseRef}).`);
