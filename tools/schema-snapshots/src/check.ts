// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Repo-wide gate over every committed schema snapshot. Runs per pull request
// (ci.yml passes the base ref via SCHEMA_COMPAT_BASE) rather than per commit,
// since it proves a branch against its base.

import { execFileSync } from 'node:child_process';

import { checkSnapshotCompat } from './compat.js';

const git = (args: string[]): string =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/**
 * The git ref holding the last-shipped schemas. Defaults to `origin/develop`
 * (the merge target) rather than a local `develop`, which can be stale enough
 * to predate the snapshots and pass vacuously. Falls back to `HEAD` before the
 * remote exists, which compares the branch with itself and so proves nothing.
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
const violations = checkSnapshotCompat(git(['rev-parse', '--show-toplevel']), baseRef);

if (violations.length > 0) {
  console.error(`Schema compatibility check failed (base: ${baseRef}):\n`);
  for (const violation of violations) console.error(`  • ${violation}`);
  process.exit(1);
}

console.log(`Schema compatibility check passed (base: ${baseRef}).`);
