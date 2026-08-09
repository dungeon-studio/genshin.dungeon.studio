// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { resolve } from 'node:path';

import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/** Every file eslint reads in a workspace. */
const LINTED_FILES = ['**/*.{ts,tsx,js,mjs,cjs}'];

/**
 * The TypeScript subset of the files eslint reads. Workspaces scope their own
 * overrides to this.
 */
export const TYPESCRIPT_FILES = ['**/*.{ts,tsx}'];

/**
 * TypeScript files the project service cannot resolve a program for, so
 * type-aware rules have to skip them. `vitest.config.ts` is claimed by no
 * `tsconfig.json` at all; `scripts/` is claimed only by `tsconfig.scripts.json`,
 * which the project service never reaches because nothing references it.
 */
const FILES_OUTSIDE_ANY_PROJECT = ['vitest.config.ts', 'scripts/**/*.ts'];

/** Paths allowed to import `devDependencies`. */
const DEV_DEPENDENCY_FILES = [
  '**/*.{test,spec}.{ts,tsx}',
  '**/test/**',
  '**/scripts/**',
  'eslint.config.js',
  '*.config.{ts,js,mjs,cjs}',
];

/**
 * The type-aware tier, plus the type-aware rules worth taking from tiers this
 * repo otherwise skips. Scoped to `TYPESCRIPT_FILES` because every rule here
 * needs a TypeScript program, and only files a `tsconfig.json` claims have one.
 *
 * @param {string} packageDir - the consuming workspace's directory.
 * @returns {import('eslint').Linter.Config}
 */
function typeAwareRules(packageDir) {
  return {
    files: TYPESCRIPT_FILES,
    // Skipped files fall back to the non-type-aware tier above rather than
    // failing to parse.
    ignores: FILES_OUTSIDE_ANY_PROJECT,
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Resolves each file's program the way `tsserver` does, so solution-style
        // `tsconfig.json` references resolve without enumerating projects here.
        projectService: true,
        tsconfigRootDir: packageDir,
      },
    },
    // Both from `stylisticTypeChecked`, whose remaining rules overlap Prettier.
    // `strictTypeChecked`'s `no-unnecessary-condition` belongs here too, but it
    // reads an index into an array or `Record` as non-optional until
    // `noUncheckedIndexedAccess` is on, and so reports correct runtime guards as
    // dead code. Enabled alongside that flag in #1217.
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  };
}

/** Rules tightening the typescript-eslint tiers above. */
const TYPESCRIPT_STRICTNESS = {
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
};

/**
 * Parameterised because `no-extraneous-dependencies` has to know which
 * `package.json` files may satisfy an import.
 *
 * @param {string} packageDir - the consuming workspace's directory.
 * @returns {import('eslint').Linter.Config}
 */
function importDiscipline(packageDir) {
  // Workspaces sit two levels below the root, whose `package.json` holds the
  // tooling dependencies they all share.
  const repoRoot = resolve(packageDir, '../..');

  return {
    files: LINTED_FILES,
    plugins: { 'import-x': importX, 'unused-imports': unusedImports },
    settings: {
      'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    },
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: DEV_DEPENDENCY_FILES,
          packageDir: [packageDir, repoRoot],
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
  };
}

/**
 * Shared flat-config base for every workspace in the monorepo.
 *
 * @param {string} packageDir - the consuming workspace's directory
 *   (`import.meta.dirname`), not this package's.
 * @returns {import('eslint').Linter.Config[]} flat config entries, already
 *   normalised, so consumers can nest the result in their own `defineConfig`.
 */
export default function genshinConfig(packageDir) {
  return defineConfig([
    globalIgnores(['dist', 'node_modules']),
    js.configs.recommended,
    // Unscoped: the preset's own file matching reaches `.mts` and `.cts`, which
    // `TYPESCRIPT_FILES` does not.
    tseslint.configs.recommended,
    typeAwareRules(packageDir),
    TYPESCRIPT_STRICTNESS,
    importDiscipline(packageDir),
  ]);
}
