// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { check_compat, initSync } from 'jsoncompat';

const require = createRequire(import.meta.url);
initSync({ module: readFileSync(require.resolve('jsoncompat/jsoncompat_wasm_bg.wasm')) });

// Any workspace package contributes snapshots by committing them at its root,
// so adding a gated package never edits this tool.
const SNAPSHOT_PATH = /^[^/]+\/[^/]+\/schema-snapshots\/([^/]+)\/(v\d+)\.json$/;

/**
 * Compare every snapshot committed at `baseRef` against the working tree,
 * returning one message per violation (empty when compatible).
 *
 * A released version's schema may only widen, so data a released build already
 * persisted keeps reading. Drives off the base branch's snapshots: versions the
 * working tree adds beyond the base carry no constraint. Trusts the drift hook
 * to keep snapshots faithful to their Zod source, so this is a JSON-vs-JSON diff
 * needing no workspace build.
 */
export function checkSnapshotCompat(repoRoot: string, baseRef: string): string[] {
  const git = (args: string[]): string =>
    execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

  const violations: string[] = [];

  for (const path of git(['ls-tree', '-r', '--name-only', baseRef]).split('\n')) {
    const match = SNAPSHOT_PATH.exec(path);
    if (match === null) continue;
    const [, name, version] = match;

    let head: string;
    try {
      head = readFileSync(join(repoRoot, path), 'utf8');
    } catch {
      violations.push(
        `${path} shipped on the base branch but is gone. Restore ${name} ${version} in its schema registry and re-export; removing it orphans data still stored under it.`,
      );
      continue;
    }

    // "deserializer" compatibility holds when the new schema accepts everything
    // the old one did (L(old) ⊆ L(new)), meaning the change only widens.
    if (!check_compat(git(['show', `${baseRef}:${path}`]), head, 'deserializer')) {
      violations.push(
        `${path} narrows: ${name} ${version} no longer accepts data already stored under it. Widen its Zod schema back, or add a new version with a migration instead of editing ${version} in place.`,
      );
    }
  }

  return violations;
}
