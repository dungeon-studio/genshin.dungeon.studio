// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// The suite that talks to a real Firestore, so it needs an emulator and cannot
// join the default run. Named off the `vitest.config.ts` pattern the root
// config globs as projects, which keeps `pnpm test` from picking it up.
//
// Its artifacts sit beside the unit suite's rather than replacing them: both
// runs upload under the `api` flag, and Codecov merges the two reports.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    include: ['src/**/*.integration.test.ts'],
    setupFiles: ['./src/test/integration-setup.ts'],
    // Every test owns a freshly generated user id, so the documents one test
    // writes are invisible to the rest and the emulator never needs clearing.
    // Sharing one Firestore connection across files is what makes that cheap.
    fileParallelism: false,
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
