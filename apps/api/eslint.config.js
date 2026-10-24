// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import genshinConfig, { TYPESCRIPT_FILES } from '@genshin/eslint-config';
import { defineConfig } from 'eslint/config';
import globals from 'globals';

import { redactedLogKeys } from './eslint-rules/redacted-log-keys.js';
import { SENSITIVE_KEYS } from './src/sensitive-keys.ts';

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
    plugins: { api: { rules: { 'redacted-log-keys': redactedLogKeys } } },
    rules: {
      'no-console': 'error',
      'api/redacted-log-keys': ['error', { keys: SENSITIVE_KEYS }],
    },
  },
]);
