// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Proves the Codecov bundle plugin still reads this app's bundle. It declares a
// peer range ending at Vite 6, and Vite 8 builds through Rolldown rather than
// Rollup, so the hooks it reads are compatible by convention rather than by
// contract. A break there costs nothing at build time and uploads an empty
// report, which Codecov renders as a bundle that simply stopped changing — so
// the failure has to be asserted here rather than waited for.
//
// Runs its own dry-run build because the plugin writes the stats file only when
// it is not uploading; the uploading build in CI leaves nothing to inspect.

import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

interface BundleStats {
  bundleName?: string;
  assets?: { name: string; size: number; gzipSize?: number }[];
  chunks?: { uniqueId: string }[];
  modules?: { name: string; size: number }[];
}

const appDir = fileURLToPath(new URL('..', import.meta.url));

// Matches `bundleName` in vite.config.ts, with the output format the plugin
// appends to it.
const statsPath = fileURLToPath(new URL('../dist/web-esm-stats.json', import.meta.url));

execFileSync('pnpm', ['exec', 'vite', 'build'], {
  cwd: appDir,
  stdio: 'inherit',
  env: { ...process.env, CODECOV_BUNDLE_DRY_RUN: 'true' },
});

let stats: BundleStats;
try {
  stats = JSON.parse(readFileSync(statsPath, 'utf-8')) as BundleStats;
} catch (error) {
  throw new Error(
    `The bundle plugin wrote no stats to ${statsPath}. It no longer recognises this ` +
      `app's bundle; check its Vite support before trusting any Codecov bundle report.`,
    { cause: error },
  );
} finally {
  // Keeps an 80 kB report that only this script reads out of anything published.
  rmSync(statsPath, { force: true });
}

const assets = stats.assets ?? [];
const chunks = stats.chunks ?? [];
const modules = stats.modules ?? [];

const failures: string[] = [];

// A bundle this app could actually serve has at least one JavaScript asset, the
// entry chunk holding it, and the modules that went into it. Each list empties
// independently when the plugin loses hold of a different bundler hook.
if (!assets.some((asset) => asset.name.endsWith('.js') && asset.size > 0)) {
  failures.push(`no JavaScript asset with a non-zero size (found ${String(assets.length)} assets)`);
}

if (chunks.length === 0) {
  failures.push('no chunks');
}

// Sized modules are what turns a size change into an attributable one; the
// plugin can list assets correctly while reporting every module as zero.
if (!modules.some((module) => module.size > 0)) {
  failures.push(`no module with a non-zero size (found ${String(modules.length)} modules)`);
}

if (failures.length > 0) {
  throw new Error(
    `Codecov bundle stats are incomplete: ${failures.join('; ')}. The plugin built ` +
      `without error but did not describe the bundle, so uploaded reports would understate it.`,
  );
}

console.log(
  `Codecov bundle stats OK: ${String(assets.length)} assets, ` +
    `${String(chunks.length)} chunks, ${String(modules.length)} modules.`,
);
