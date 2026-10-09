// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { defineConfig } from 'vitest/config';

/**
 * Shared Vitest base for every workspace, composed with `mergeConfig`.
 *
 * @remarks
 * `coverage` and `reporters` are root-only options: they take effect when
 * turbo runs a package as its own root and are inert under the repository's
 * root `vitest.config.ts`.
 */
export default defineConfig({
  test: {
    reporters: ['default', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
    },
  },
});
