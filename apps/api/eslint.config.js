// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import importConfig from '../../eslint.config.base.mjs';

export default [
  {
    ignores: ['dist'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
  ...importConfig(import.meta.dirname),
];
