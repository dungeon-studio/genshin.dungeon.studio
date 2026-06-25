/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

import importConfig from '../../eslint.config.base.mjs';

export default [
  { ignores: ['dist', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...importConfig(import.meta.dirname),
];
