// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import eslintReact from '@eslint-react/eslint-plugin';
import genshinConfig from '@genshin/eslint-config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const TS_FILES = ['**/*.{ts,tsx}'];
const TEST_FILES = ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'];
const SHADCN_SCAFFOLDS = ['src/components/ui/**/*.{ts,tsx}'];

const eslintReactRecommended = eslintReact.configs['recommended-typescript'];

/**
 * Both plugins implement these. `eslint-plugin-react-hooks` is first-party and
 * compiler-backed, so it keeps them; enabling both reports every hook violation
 * twice.
 */
const RULES_OWNED_BY_REACT_HOOKS = {
  '@eslint-react/error-boundaries': 'off',
  '@eslint-react/exhaustive-deps': 'off',
  '@eslint-react/purity': 'off',
  '@eslint-react/rules-of-hooks': 'off',
  '@eslint-react/set-state-in-effect': 'off',
  '@eslint-react/set-state-in-render': 'off',
  '@eslint-react/static-components': 'off',
  '@eslint-react/unsupported-syntax': 'off',
  '@eslint-react/use-memo': 'off',
};

export default [
  ...genshinConfig(import.meta.dirname),
  {
    files: TS_FILES,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: TS_FILES,
    ...eslintReactRecommended,
    rules: {
      ...eslintReactRecommended.rules,
      // Wants every `useRef` result named `*Ref`; ours hold mutable instance
      // state rather than element handles.
      '@eslint-react/naming-convention-ref-name': 'off',
    },
  },
  {
    files: TS_FILES,
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...RULES_OWNED_BY_REACT_HOOKS,
    },
  },
  {
    // `@eslint-react` takes no position on declaration syntax, so
    // `function-component-definition` has no counterpart. The version pin
    // avoids a `detect` path that calls an API ESLint 10 removed.
    files: TS_FILES,
    plugins: { react },
    settings: { react: { version: '19' } },
    rules: {
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
    },
  },
  {
    files: TS_FILES,
    plugins: { 'react-refresh': reactRefresh },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    files: TS_FILES,
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeAlias',
          filter: { regex: '^.*Props$', match: true },
          format: ['PascalCase'],
          suffix: ['Props'],
        },
      ],
    },
  },
  {
    files: SHADCN_SCAFFOLDS,
    rules: {
      'react/function-component-definition': 'off',
    },
  },
  {
    files: TEST_FILES,
    rules: {
      // A `renderHook` wrapper closes over per-test state and never remounts on
      // a parent re-render, so the rule's premise does not hold.
      '@eslint-react/no-nested-component-definitions': 'off',
    },
  },
];
