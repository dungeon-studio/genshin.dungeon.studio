// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// Needs a running emulator, so it cannot join the default run: the root config
// globs `vitest.config.ts` as its projects, and this filename falls outside
// that glob.
//
// Artifact paths sit beside the unit suite's rather than replacing them. Both
// upload under the `api` flag, and Codecov merges the two reports.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    env: { LOG_LEVEL: 'silent' },
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/test/integration-setup.ts'],
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/integration-junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage-integration',
    },
  },
});
