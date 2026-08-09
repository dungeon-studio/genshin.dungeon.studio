// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Proves the Codecov bundle plugin still reads this app's bundle. It declares no
// support for the Vite major this app builds on, and the bundler underneath is
// Rolldown rather than the Rollup its hooks assume, so collection holds by
// convention rather than by contract. It would break silently: the build still
// succeeds, the report uploads empty, and Codecov shows a bundle that stopped
// changing.
//
// Builds in the plugin's dry-run mode, the only one that writes the report to
// disk; the uploading build in CI leaves nothing to inspect.

import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

interface Sized {
  size: number;
}

interface BundleStats {
  assets?: (Sized & { name: string })[];
  chunks?: { uniqueId: string }[];
  modules?: (Sized & { name: string })[];
}

const appDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = fileURLToPath(new URL('../dist', import.meta.url));

// The plugin derives the filename from `bundleName` in vite.config.ts and the
// output format it appends.
const statsSuffix = '-stats.json';

function statsReports(): string[] {
  if (!existsSync(distDir)) return [];

  return readdirSync(distDir)
    .filter((name) => name.endsWith(statsSuffix))
    .map((name) => join(distDir, name));
}

function collectBundleStats(): BundleStats {
  // A report left by an earlier run would otherwise pass for a fresh one.
  for (const stale of statsReports()) rmSync(stale);

  execFileSync('pnpm', ['exec', 'vite', 'build'], {
    cwd: appDir,
    stdio: 'inherit',
    env: { ...process.env, CODECOV_BUNDLE_DRY_RUN: 'true' },
  });

  const [report, ...surplus] = statsReports();

  if (report === undefined) {
    throw new Error(
      `The bundle plugin wrote no ${statsSuffix} report to ${distDir}. It no longer ` +
        `recognises this app's bundle; check its Vite support before trusting any ` +
        `Codecov bundle report.`,
    );
  }

  if (surplus.length > 0) {
    throw new Error(
      `Expected one ${statsSuffix} report in ${distDir}, found ${String(surplus.length + 1)}: ` +
        `${[report, ...surplus].join(', ')}. Each describes a different output, so there ` +
        `is no single report to hold the build to.`,
    );
  }

  try {
    return JSON.parse(readFileSync(report, 'utf-8')) as BundleStats;
  } finally {
    // dist/ is published; the report is scaffolding for this script alone.
    rmSync(report, { force: true });
  }
}

function sized<T extends Sized>(entries: T[], matching: (entry: T) => boolean = () => true): T[] {
  return entries.filter((entry) => entry.size > 0 && matching(entry));
}

// Each list empties independently as the plugin loses hold of a different hook,
// and sizes zero out separately again: it can name every module while measuring
// none, which costs the report its attribution.
function shortfallsIn(stats: BundleStats): string[] {
  const assets = stats.assets ?? [];
  const chunks = stats.chunks ?? [];
  const modules = stats.modules ?? [];

  const shortfalls: string[] = [];

  if (sized(assets, (asset) => asset.name.endsWith('.js')).length === 0) {
    shortfalls.push(
      `no JavaScript asset with a non-zero size (found ${String(assets.length)} assets)`,
    );
  }

  if (chunks.length === 0) {
    shortfalls.push('no chunks');
  }

  if (sized(modules).length === 0) {
    shortfalls.push(`no module with a non-zero size (found ${String(modules.length)} modules)`);
  }

  return shortfalls;
}

function summarise(stats: BundleStats): string {
  return (
    `${String(stats.assets?.length ?? 0)} assets, ` +
    `${String(stats.chunks?.length ?? 0)} chunks, ` +
    `${String(stats.modules?.length ?? 0)} modules`
  );
}

const stats = collectBundleStats();
const shortfalls = shortfallsIn(stats);

if (shortfalls.length > 0) {
  throw new Error(
    `Codecov bundle stats are incomplete: ${shortfalls.join('; ')}. The plugin built ` +
      `without error but did not describe the bundle, so uploaded reports would understate it.`,
  );
}

console.log(`Codecov bundle stats OK: ${summarise(stats)}.`);
