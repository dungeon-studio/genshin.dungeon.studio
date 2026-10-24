// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { check_compat, initSync } from 'jsoncompat';

import { git } from './git.js';

const require = createRequire(import.meta.url);

// Any workspace package contributes snapshots by committing them at its root,
// so adding a gated package never edits this tool.
const SNAPSHOT_PATH = /^[^/]+\/[^/]+\/schema-snapshots\/([^/]+)\/(v\d+)\.json$/;

/** `v{n}.retired` beside a snapshot marks its deletion as deliberate. */
function tombstoneFor(snapshot: string): string {
  return snapshot.replace(/\.json$/, '.retired');
}

/**
 * Compare every snapshot committed at `baseRef` against the working tree,
 * returning one message per violation (empty when compatible).
 *
 * A released version's schema may only widen, so data a released build already
 * persisted keeps reading. Only the base branch's snapshots constrain the check:
 * versions the working tree adds carry no constraint. Trusts the drift hook
 * to keep snapshots faithful to their Zod source, so this is a JSON-vs-JSON diff
 * needing no workspace build.
 */
export function checkSnapshotCompat(repoRoot: string, baseRef: string): string[] {
  initSync({ module: readFileSync(require.resolve('jsoncompat/jsoncompat_wasm_bg.wasm')) });

  return git(['ls-tree', '-r', '--name-only', baseRef], repoRoot)
    .split('\n')
    .flatMap((path) => {
      const match = SNAPSHOT_PATH.exec(path);
      if (match === null) return [];
      const [, name, version] = match;
      const file = join(repoRoot, path);

      if (!existsSync(file)) {
        // A tombstone records that nothing reads this version any longer, so
        // no stored data is orphaned by its removal.
        if (existsSync(tombstoneFor(file))) return [];

        return [
          `${path} shipped on the base branch but is gone. Restore ${name} ${version} in its schema registry and re-export; removing it orphans data still stored under it. If nothing reads ${version} any longer, commit ${tombstoneFor(path)} saying why.`,
        ];
      }

      const base = git(['show', `${baseRef}:${path}`], repoRoot);
      const head = readFileSync(file, 'utf8');

      // "deserializer" mode passes when the new schema accepts everything the old one did.
      if (check_compat(base, head, 'deserializer')) return [];

      return [
        `${path} narrows: ${name} ${version} no longer accepts data already stored under it. Widen its Zod schema back, or add a new version with a migration instead of editing ${version} in place.`,
      ];
    });
}
