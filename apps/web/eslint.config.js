// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import eslintReact from '@eslint-react/eslint-plugin';
import genshinConfig from '@genshin/eslint-config';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  ...genshinConfig(import.meta.dirname),
  {
    files: ['**/*.{ts,tsx}'],
    ...eslintReact.configs['recommended-typescript'],
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // `eslint-plugin-react-hooks` is first-party React and carries the
      // compiler-backed analysis, so it owns every rule the two plugins both
      // implement. `@eslint-react`'s copies report the same violations under
      // different names; leaving them on double-reports each one.
      '@eslint-react/error-boundaries': 'off',
      '@eslint-react/exhaustive-deps': 'off',
      '@eslint-react/purity': 'off',
      '@eslint-react/rules-of-hooks': 'off',
      '@eslint-react/set-state-in-effect': 'off',
      '@eslint-react/set-state-in-render': 'off',
      '@eslint-react/static-components': 'off',
      '@eslint-react/unsupported-syntax': 'off',
      '@eslint-react/use-memo': 'off',
      // Flags any `useRef` result not named `*Ref`, which catches refs used as
      // mutable instance state rather than as element handles.
      '@eslint-react/naming-convention-ref-name': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // `@eslint-react` takes no position on declaration syntax, so the
      // classical plugin stays loaded for this one rule.
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
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
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      react: { version: '19' },
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      'react/function-component-definition': 'off',
    },
  },
  {
    files: ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      // `renderHook`'s `wrapper` is defined per test so it can close over that
      // test's state. The rule guards against remounting on parent re-render,
      // which a wrapper passed straight to the renderer never does.
      '@eslint-react/no-nested-component-definitions': 'off',
    },
  },
];
