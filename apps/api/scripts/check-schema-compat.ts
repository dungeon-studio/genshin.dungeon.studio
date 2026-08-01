// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Repo-wide gate (hosted in the api package, which already carries the jsoncompat
// dep): rejects a schema change that would make data a released build already
// persisted fail to read — Firestore documents (apps/api) and localStorage
// snapshots written by zustand `persist` (apps/web). A released version's schema
// may only widen, so a breaking change must add a new schema version rather than
// edit an existing one in place.
//
// Compares the committed snapshots against those on the base branch, trusting the
// schema-snapshots drift hook to keep them faithful to their Zod source — so it's
// a JSON-vs-JSON diff with no workspace build, and a branch-vs-base check that
// runs in CI (ci.yml passes the base ref via SCHEMA_COMPAT_BASE) rather than a
// per-commit hook.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { check_compat, initSync } from 'jsoncompat';

const require = createRequire(import.meta.url);
initSync({ module: readFileSync(require.resolve('jsoncompat/jsoncompat_wasm_bg.wasm')) });

// Each committed snapshot root, paired with a resolver from (repository, version)
// back to the Zod source file named in violation messages.
const SNAPSHOT_ROOTS: ReadonlyArray<{
  prefix: string;
  sourceFor: (repository: string, version: string) => string;
}> = [
  {
    prefix: 'apps/api/schema-snapshots',
    sourceFor: (repository, version) =>
      `apps/api/src/repositories/${repository}/schemas/${version}.ts`,
  },
  {
    // A web snapshot is named for its `persist` store, which doesn't imply a
    // source path, so point at the registry that maps the store to its schemas.
    prefix: 'apps/web/schema-snapshots',
    sourceFor: (repository, version) =>
      `apps/web/scripts/schema-registry.ts (store "${repository}", ${version})`,
  },
];

/**
 * Stores retired on purpose, exempt from the missing-snapshot violation, which
 * otherwise reads every disappearance as an accident.
 *
 * Entries are transient: the loop below only visits paths the base branch still
 * has, so an entry is spent once its deletion merges. Prune, don't accumulate.
 */
const RETIRED_SNAPSHOTS: ReadonlySet<string> = new Set([
  'apps/web/schema-snapshots/genshin-collection/v1.json',
]);

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();

// Run every git invocation from the repo root so pathspecs resolve consistently
// regardless of the caller's directory (the package script runs from apps/api).
function git(args: string[]): string {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
}

/**
 * The git ref holding the last-shipped schemas. Defaults to `origin/develop`
 * (the merge target) when available, falling back to `HEAD` for local runs
 * before the branch is pushed. Override with `SCHEMA_COMPAT_BASE`.
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

/** Snapshot paths (repo-root-relative) committed under `prefix` at `ref`. */
function snapshotPathsAt(ref: string, prefix: string): string[] {
  return git(['ls-tree', '-r', '--name-only', ref, '--', prefix])
    .split('\n')
    .filter((line) => line.endsWith('.json'));
}

/** File contents at `ref:path`, or null when the path does not exist there. */
function showAt(ref: string, path: string): string | null {
  try {
    return git(['show', `${ref}:${path}`]);
  } catch {
    return null;
  }
}

const baseRef = resolveBaseRef();
const violations: string[] = [];

// Drive off the versions the base branch shipped: those are the schemas with
// data already persisted that HEAD must keep accepting. Versions HEAD adds
// beyond the base carry no compatibility constraint.
for (const { prefix, sourceFor } of SNAPSHOT_ROOTS) {
  for (const path of snapshotPathsAt(baseRef, prefix)) {
    if (RETIRED_SNAPSHOTS.has(path)) continue;

    const base = showAt(baseRef, path);
    if (base === null) continue; // race-proofing; ls-tree already filtered to base.

    const [repository, version] = path
      .slice(`${prefix}/`.length)
      .replace(/\.json$/, '')
      .split('/');
    const source = sourceFor(repository, version);

    let head: string;
    try {
      head = readFileSync(join(repoRoot, path), 'utf8');
    } catch {
      violations.push(
        `${repository} ${version} shipped on the base branch but its snapshot is gone. Restore the version at ${source} and re-export; removing it orphans data still stored under it.`,
      );
      continue;
    }

    // "deserializer" compatibility holds when the new schema accepts everything
    // the old one did (L(old) ⊆ L(new)) — i.e. the change only widens.
    if (!check_compat(base, head, 'deserializer')) {
      violations.push(
        `${source} narrows the schema: it no longer accepts data already stored under ${repository} ${version}. Widen it back, or add a new version with a migration instead of editing ${version} in place.`,
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
