// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineConfig } from 'vitest/config';

// Globbing the config filename, not the directory, leaves out
// `apps/web/vite.config.ts` (no `test` block) and `tools/e2e` (Playwright)
// with no exclusion list to maintain.
//
// `coverage` and `reporters` are root-only in Vitest: each project config's
// copies apply only when turbo runs that package as its own root, so a root
// `pnpm vitest` writes no junit or coverage artifacts.
export default defineConfig({
  test: {
    projects: [
      'apps/*/vitest.config.ts',
      'packages/*/vitest.config.ts',
      'tools/*/vitest.config.ts',
    ],
  },
});
