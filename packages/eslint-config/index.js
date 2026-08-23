// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { resolve } from 'node:path';

import js from '@eslint/js';
import vitest from '@vitest/eslint-plugin';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import unusedImports from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

/** The file kinds this monorepo treats as modules. */
const MODULE_EXTENSIONS = ['ts', 'tsx', 'cts', 'mts', 'js', 'jsx', 'cjs', 'mjs'];

/** Every file eslint reads in a workspace. */
const LINTED_FILES = [`**/*.{${MODULE_EXTENSIONS.join(',')}}`];

/**
 * The TypeScript subset of the files eslint reads. Workspaces scope their own
 * overrides to this.
 */
export const TYPESCRIPT_FILES = ['**/*.{ts,tsx}'];

/**
 * The vitest suites and their shared helpers. Playwright's `*.spec.ts` is left
 * out on purpose; these rules do not describe it.
 */
export const VITEST_FILES = ['**/*.test.{ts,tsx}', '**/test/**/*.{ts,tsx}'];

/**
 * TypeScript files no reachable `tsconfig.json` claims, so type-aware rules
 * skip them: nothing claims a `vitest.*config.ts`, and only
 * `tsconfig.scripts.json` claims `scripts/`, which the project service never
 * reaches because nothing references it.
 */
const FILES_OUTSIDE_ANY_PROJECT = ['vitest.*config.ts', 'scripts/**/*.ts'];

/** Paths allowed to import `devDependencies`. */
const DEV_DEPENDENCY_FILES = [
  '**/*.{test,spec}.{ts,tsx}',
  '**/test/**',
  '**/scripts/**',
  'eslint.config.js',
  '*.config.{ts,js,mjs,cjs}',
];

const VITEST_CONVENTIONS = {
  files: VITEST_FILES,
  extends: [vitest.configs.recommended],
  rules: {
    'vitest/consistent-test-it': ['error', { fn: 'it' }],
  },
};

/**
 * The type-aware tier, plus the rules worth taking from tiers this repo
 * otherwise skips. Scoped to `TYPESCRIPT_FILES` because every rule here needs
 * a TypeScript program, and only files a `tsconfig.json` claims have one.
 *
 * @param {string} packageDir - the consuming workspace's directory.
 * @returns {import('eslint').Linter.Config}
 */
function typeAwareRules(packageDir) {
  return {
    files: TYPESCRIPT_FILES,
    ignores: FILES_OUTSIDE_ANY_PROJECT,
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // Finds each file's program the way `tsserver` does, which reaches
        // solution-style `tsconfig.json` references without listing projects.
        projectService: true,
        tsconfigRootDir: packageDir,
      },
    },
    // Both from `stylisticTypeChecked`, whose remaining rules overlap Prettier.
    rules: {
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
    },
  };
}

/** Rules tightening the typescript-eslint presets. */
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

/** Import rules that need no workspace context. */
const IMPORT_DISCIPLINE = {
  files: LINTED_FILES,
  plugins: { 'import-x': importX, 'unused-imports': unusedImports },
  settings: {
    'import-x/resolver-next': [createTypeScriptImportResolver({ alwaysTryTypes: true })],
    // `import-x` parses an imported file only if its extension is listed, and
    // the default omits TypeScript — which leaves `no-cycle` silently inert.
    'import-x/extensions': MODULE_EXTENSIONS.map((extension) => `.${extension}`),
  },
  rules: {
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
    // Sibling workspaces resolve through built `dist/`, so checking them would
    // report whether the repo is built, not whether the import is correct.
    'import-x/no-unresolved': ['error', { ignore: ['^@genshin/'] }],
    // Cycles inside `node_modules` are not ours to break.
    'import-x/no-cycle': ['error', { ignoreExternal: true }],
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

/**
 * Parameterised because `no-extraneous-dependencies` has to know which
 * `package.json` files may satisfy an import.
 *
 * @param {string} packageDir - the consuming workspace's directory.
 * @returns {import('eslint').Linter.Config}
 */
function declaredDependencies(packageDir) {
  // Workspaces sit two levels below the root, whose `package.json` holds the
  // tooling dependencies they all share.
  const repoRoot = resolve(packageDir, '../..');

  return {
    files: LINTED_FILES,
    rules: {
      'import-x/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: DEV_DEPENDENCY_FILES,
          packageDir: [packageDir, repoRoot],
        },
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
    IMPORT_DISCIPLINE,
    declaredDependencies(packageDir),
    VITEST_CONVENTIONS,
  ]);
}
