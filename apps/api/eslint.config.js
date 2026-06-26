// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import genshinConfig from '@genshin/eslint-config';
import globals from 'globals';

export default [
  ...genshinConfig(import.meta.dirname),
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
  },
];
