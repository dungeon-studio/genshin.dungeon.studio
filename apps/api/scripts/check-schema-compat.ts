// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Rejects a schema change that would make documents already stored in Firestore
// fail to read: a released version's schema may only widen, so a breaking change
// must add a new verzod version rather than edit an existing one in place.
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

const SNAPSHOT_PREFIX = 'apps/api/schema-snapshots';

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

/** Snapshot paths (repo-root-relative) committed under the snapshot prefix at `ref`. */
function snapshotPathsAt(ref: string): string[] {
  return git(['ls-tree', '-r', '--name-only', ref, '--', SNAPSHOT_PREFIX])
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
// documents already in Firestore that HEAD must keep accepting. Versions HEAD
// adds beyond the base carry no compatibility constraint.
for (const path of snapshotPathsAt(baseRef)) {
  const base = showAt(baseRef, path);
  if (base === null) continue; // race-proofing; ls-tree already filtered to base.

  const [repository, version] = path
    .slice(`${SNAPSHOT_PREFIX}/`.length)
    .replace(/\.json$/, '')
    .split('/');
  const source = `apps/api/src/repositories/${repository}/schemas/${version}.ts`;

  let head: string;
  try {
    head = readFileSync(join(repoRoot, path), 'utf8');
  } catch {
    violations.push(
      `${repository} ${version} shipped on the base branch but its snapshot is gone. Restore the version at ${source} and re-export; removing it orphans documents still stored under it.`,
    );
    continue;
  }

  // "deserializer" compatibility holds when the new schema accepts everything
  // the old one did (L(old) ⊆ L(new)) — i.e. the change only widens.
  if (!check_compat(base, head, 'deserializer')) {
    violations.push(
      `${source} narrows the schema: it no longer accepts documents already stored under ${repository} ${version}. Widen it back, or add a new version with an \`up\` migration instead of editing ${version} in place.`,
    );
  }
}

if (violations.length > 0) {
  console.error(`Schema compatibility check failed (base: ${baseRef}):\n`);
  for (const violation of violations) console.error(`  • ${violation}`);
  process.exit(1);
}

console.log(`Schema compatibility check passed (base: ${baseRef}).`);
