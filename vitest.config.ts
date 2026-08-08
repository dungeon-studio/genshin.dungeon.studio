// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineConfig } from 'vitest/config';

// Aggregates every workspace package that opts into Vitest by owning a
// `vitest.config.ts`. Globbing the config file rather than the directory keeps
// `apps/web/vite.config.ts` (no `test` block) and `tools/e2e` (Playwright) out
// of the project list without an exclusion to maintain.
//
// `pnpm turbo run test` remains the build-ordered entry point and the only one
// that produces reports. `coverage` and `reporters` are root-only options, so
// each project's copies apply when turbo runs it as its own root and are
// ignored here; a root `pnpm vitest` prints results and writes no artifacts.
export default defineConfig({
  test: {
    projects: [
      'apps/*/vitest.config.ts',
      'packages/*/vitest.config.ts',
      'tools/*/vitest.config.ts',
    ],
  },
});
