// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    // Error-path suites log by design. Tests asserting on log output build
    // their own logger, so nothing here needs the process-wide one to emit.
    env: { LOG_LEVEL: 'silent' },
    // Spread the defaults: assigning `exclude` replaces them, which would drop
    // node_modules and dist from the ignore list.
    exclude: [...configDefaults.exclude, '**/*.integration.test.ts'],
    setupFiles: ['./src/test/setup.ts'],
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
