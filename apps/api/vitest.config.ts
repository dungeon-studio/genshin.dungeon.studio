// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { fileURLToPath } from 'node:url';

import baseConfig from '@genshin/vitest-config';
import { defineConfig, mergeConfig } from 'vitest/config';

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
      // Error-path suites log by design; silence keeps the run readable.
      env: { LOG_LEVEL: 'silent' },
      exclude: ['**/*.integration.test.ts'],
      setupFiles: ['./src/test/setup.ts'],
    },
  }),
);
