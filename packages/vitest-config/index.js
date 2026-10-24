// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { configDefaults, defineConfig } from 'vitest/config';

/** Vitest settings every workspace shares. */
export default defineConfig({
  test: {
    // Assigning `exclude` drops Vitest's defaults instead of extending them.
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
