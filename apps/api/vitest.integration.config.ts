// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { fileURLToPath } from 'node:url';

import baseConfig from '@genshin/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

// Needs a running emulator, so it cannot join the default run: the root config
// globs `vitest.config.ts` as its projects, and this filename falls outside
// that glob.
//
// Artifact paths sit beside the unit suite's rather than replacing them. Both
// upload under the `api` flag, and Codecov merges the two reports.
export default mergeConfig(
  baseConfig,
  defineConfig({
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
      outputFile: {
        junit: './test-results/integration-junit.xml',
      },
      coverage: {
        reportsDirectory: './coverage-integration',
      },
    },
  }),
);
