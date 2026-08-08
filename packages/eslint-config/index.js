// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { resolve } from 'node:path';

import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

const TYPESCRIPT_FILES = ['**/*.{ts,tsx}'];
const LINTED_FILES = ['**/*.{ts,tsx,js,mjs,cjs}'];

/**
 * Shared flat-config base for every workspace in the monorepo.
 *
 * @param {string} packageDir - the consuming workspace's directory
 *   (`import.meta.dirname`). Used to resolve
 *   `import-x/no-extraneous-dependencies` against the workspace and the repo
 *   root, so it must be the consumer's path, not this package's.
 * @returns {import('eslint').Linter.Config[]} flat config entries; already
 *   normalised, so consumers can nest the result inside their own
 *   `defineConfig` call rather than spreading it.
 */
export default function genshinConfig(packageDir) {
  return defineConfig([
    globalIgnores(['dist', 'node_modules']),
    js.configs.recommended,
    // Left unscoped so the preset keeps its own file matching, which reaches
    // `.mts`/`.cts` as well as `TYPESCRIPT_FILES`.
    tseslint.configs.recommended,
    {
      files: TYPESCRIPT_FILES,
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/explicit-module-boundary-types': [
          'error',
          {
            allowArgumentsExplicitlyTypedAsAny: false,
            allowDirectConstAssertionInArrowFunctions: true,
            allowHigherOrderFunctions: true,
          },
        ],
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'Use const objects or union types instead of enums.',
          },
        ],
      },
    },
    {
      files: LINTED_FILES,
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
              '**/scripts/**',
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
  ]);
}
