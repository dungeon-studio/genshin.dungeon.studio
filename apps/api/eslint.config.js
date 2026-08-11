// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import genshinConfig, { TYPESCRIPT_FILES } from '@genshin/eslint-config';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

export default defineConfig([
  genshinConfig(import.meta.dirname),
  {
    files: TYPESCRIPT_FILES,
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  {
    // Server code logs through `@/logger.js`. `scripts/` is outside the scope:
    // those run in a terminal, where console output is the report.
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
]);
