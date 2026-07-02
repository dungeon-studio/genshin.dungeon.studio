// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Proves that every Firestore document schema only ever *widens* relative to
// the last shipped version, so the reader keeps accepting documents already
// stored under an older schema. Breaking changes must go through a new verzod
// version (a new `schemaVersion` branch with an `up` migration), never an
// in-place edit. See CONTRIBUTING.md "Firestore schema evolution".
//
// Compares the committed snapshots at HEAD against those committed on the PR's
// base branch — a branch-vs-base invariant, not a property of any single commit.
// It trusts the `schema-snapshots` drift hook to keep HEAD's snapshots faithful
// to their Zod source, so it needs no workspace build: it diffs JSON against
// JSON. It runs in ci.yml (which passes the real base ref via SCHEMA_COMPAT_BASE),
// not in a pre-commit hook — reaching for a base ref on the local commit path
// would be non-hermetic and network-coupled. Run it locally with
// `pnpm --filter @genshin/api schemas:check`.

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

  const label = path
    .slice(`${SNAPSHOT_PREFIX}/`.length)
    .replace(/\.json$/, '')
    .replace('/', ' ');

  let head: string;
  try {
    head = readFileSync(join(repoRoot, path), 'utf8');
  } catch {
    violations.push(
      `${label} was shipped but its snapshot is gone. Removing a version orphans documents still stored under it.`,
    );
    continue;
  }

  // "deserializer" compatibility holds when the new schema accepts everything
  // the old one did (L(old) ⊆ L(new)) — i.e. the change only widens.
  if (!check_compat(base, head, 'deserializer')) {
    violations.push(
      `${label} narrows the schema. Documents stored under it would no longer validate. Add a new version with an \`up\` migration instead of editing it in place.`,
    );
  }
}

if (violations.length > 0) {
  console.error(`Schema compatibility check failed (base: ${baseRef}):\n`);
  for (const violation of violations) console.error(`  • ${violation}`);
  process.exit(1);
}

console.log(`Schema compatibility check passed (base: ${baseRef}).`);
