// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Proves that every Firestore document schema only ever *widens* relative to
// the last shipped version, so the reader keeps accepting documents already
// stored under an older schema. Breaking changes must go through a new verzod
// version (a new `schemaVersion` branch with an `up` migration), never an
// in-place edit. See CONTRIBUTING.md "Firestore schema evolution".
//
// The comparison is against the snapshot committed on the base branch (the last
// shipped schema), not the regenerated working-tree snapshot — comparing a
// change to itself would always look compatible.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

import { check_compat, initSync } from 'jsoncompat';

import { SCHEMA_REGISTRY, toSnapshot } from './schema-registry.js';

const require = createRequire(import.meta.url);
initSync({ module: readFileSync(require.resolve('jsoncompat/jsoncompat_wasm_bg.wasm')) });

const SNAPSHOT_PREFIX = 'apps/api/schema-snapshots';

/**
 * The git ref holding the last-shipped schemas. Defaults to `origin/develop`
 * (the merge target) when available, falling back to `HEAD` for local commits
 * before the branch is pushed. Override with `SCHEMA_COMPAT_BASE`.
 */
function resolveBaseRef(): string {
  const override = process.env.SCHEMA_COMPAT_BASE;
  if (override) return override;

  try {
    execFileSync('git', ['rev-parse', '--verify', '--quiet', 'origin/develop'], {
      stdio: 'ignore',
    });
    return 'origin/develop';
  } catch {
    return 'HEAD';
  }
}

/** The snapshot committed for `repository`/`version` at `baseRef`, or null if it did not exist. */
function snapshotAtBase(baseRef: string, repository: string, version: number): string | null {
  try {
    return execFileSync(
      'git',
      ['show', `${baseRef}:${SNAPSHOT_PREFIX}/${repository}/v${version}.json`],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );
  } catch {
    return null;
  }
}

const baseRef = resolveBaseRef();
const violations: string[] = [];

for (const [repository, { versions, currentVersion }] of Object.entries(SCHEMA_REGISTRY)) {
  if (currentVersion !== versions.length - 1) {
    violations.push(
      `${repository}: CURRENT_VERSION is ${String(currentVersion)} but the latest defined schema is v${String(versions.length - 1)}.`,
    );
  }

  // Walk every version the base branch shipped. Stop at the first gap: verzod
  // versions are contiguous from 0, so a missing version means none follow.
  for (let version = 0; ; version++) {
    const base = snapshotAtBase(baseRef, repository, version);
    if (base === null) break;

    if (version >= versions.length) {
      violations.push(
        `${repository}: v${String(version)} was shipped but is no longer defined. Removing a version orphans documents still stored under it.`,
      );
      continue;
    }

    // "deserializer" compatibility holds when the new schema accepts everything
    // the old one did (L(old) ⊆ L(new)) — i.e. the change only widens.
    if (!check_compat(base, toSnapshot(versions[version]), 'deserializer')) {
      violations.push(
        `${repository}: v${String(version)} narrows the schema. Documents stored under it would no longer validate. Add a new version with an \`up\` migration instead of editing v${String(version)} in place.`,
      );
    }
  }
}

if (violations.length > 0) {
  console.error(`Schema compatibility check failed (base: ${baseRef}):\n`);
  for (const violation of violations) console.error(`  • ${violation}`);
  process.exit(1);
}

console.log(`Schema compatibility check passed (base: ${baseRef}).`);
