// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { resolve } from 'node:path';

import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';

/**
 * Shared import-management config for every workspace package.
 *
 * Holds the import rules that must stay identical across packages: dependency
 * hygiene, deterministic ordering, and unused-import removal. Spread the result
 * into a package's flat config after `js`/`typescript-eslint` recommended sets
 * so these rules win on conflict (`unused-imports` supersedes the recommended
 * `no-unused-vars`).
 *
 * @param {string} packageDir - the consuming package's `import.meta.dirname`,
 *   used to resolve its own and the workspace-root `package.json` for the
 *   extraneous-dependencies check.
 * @returns {import('eslint').Linter.Config[]}
 */
export default function importConfig(packageDir) {
  return [
    {
      files: ['**/*.{ts,tsx,js,mjs,cjs}'],
      plugins: { 'import-x': importX, 'unused-imports': unusedImports },
      settings: {
        'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
      },
      rules: {
        'import-x/no-extraneous-dependencies': [
          'error',
          {
            devDependencies: [
              '**/*.{test,spec}.{ts,tsx}',
              '**/test/**',
              'eslint.config.js',
              '*.config.{ts,js,mjs,cjs}',
            ],
            packageDir: [packageDir, resolve(packageDir, '../..')],
          },
        ],
        'import-x/order': [
          'error',
          {
            groups: ['builtin', 'external', 'internal', ['parent', 'sibling', 'index']],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
          },
        ],
        'import-x/no-duplicates': 'error',
        'import-x/newline-after-import': 'error',
        // `unused-imports` owns unused-symbol reporting so removals are
        // autofixable; the recommended `no-unused-vars` rules are disabled to
        // avoid double-reporting.
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
          'error',
          { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
        ],
      },
    },
  ];
}
