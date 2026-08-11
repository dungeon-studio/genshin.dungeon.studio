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
    // The server logs through `@/logger.js`, whose JSON output Cloud Logging and
    // Loki read. `scripts/` is outside this: those run in a terminal, where
    // their console output is the report.
    files: ['src/**/*.ts'],
    rules: {
      'no-console': 'error',
    },
  },
]);
