// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { configDefaults, defineConfig } from 'vitest/config';

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
    // Spread the defaults: assigning `exclude` replaces them, which would drop
    // node_modules from the ignore list.
    exclude: [...configDefaults.exclude, '**/dist/**'],
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
