// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import eslintReact from '@eslint-react/eslint-plugin';
import genshinConfig, { TYPESCRIPT_FILES } from '@genshin/eslint-config';
import { defineConfig } from 'eslint/config';
import jsxA11yX from 'eslint-plugin-jsx-a11y-x';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const TEST_FILES = ['**/*.{test,spec}.{ts,tsx}', 'src/test/**/*.{ts,tsx}'];
const SHADCN_SCAFFOLDS = ['src/components/ui/**/*.{ts,tsx}'];

/**
 * `@eslint-react` and `eslint-plugin-react-hooks` both implement these.
 * react-hooks is first-party and compiler-backed, so it keeps them; enabling
 * both reports every hook violation twice.
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

// Rules here scope to `TYPESCRIPT_FILES` because this workspace also lints
// plain-JavaScript config files, which none of them apply to.
export default defineConfig([
  genshinConfig(import.meta.dirname),
  {
    files: TYPESCRIPT_FILES,
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: TYPESCRIPT_FILES,
    extends: [
      eslintReact.configs['recommended-typescript'],
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    rules: {
      // Wants every `useRef` result named `*Ref`; ours hold mutable instance
      // state rather than element handles.
      '@eslint-react/naming-convention-ref-name': 'off',
      ...RULES_OWNED_BY_REACT_HOOKS,
      // The Vite preset errors; a missed fast refresh costs a manual reload.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  {
    // This preset brings its own `languageOptions`, which inside the `extends`
    // list above would take precedence over this workspace's.
    files: TYPESCRIPT_FILES,
    extends: [jsxA11yX.configs.recommended],
  },
  {
    files: TYPESCRIPT_FILES,
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
    // `@eslint-react` has no counterpart for `function-component-definition`,
    // the only reason this plugin is here.
    files: TYPESCRIPT_FILES,
    // Hand-registered because this plugin's flat preset would enable its whole
    // recommended set.
    plugins: { react },
    // Pinned because `detect` calls an API ESLint 10 removed.
    settings: { react: { version: '19' } },
    rules: {
      'react/function-component-definition': ['error', { namedComponents: 'function-declaration' }],
    },
  },
  {
    files: SHADCN_SCAFFOLDS,
    rules: {
      // Upstream scaffolds are `const X = React.forwardRef(...)`, not function
      // declarations; rewriting them would fight every regeneration.
      'react/function-component-definition': 'off',
      // `CardTitle` spreads children into its `<h3>`, so content lives at the call site.
      'jsx-a11y-x/heading-has-content': 'off',
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
]);
