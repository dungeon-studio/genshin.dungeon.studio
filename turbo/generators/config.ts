// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PlopTypes } from '@turbo/gen';

// packages/validation is the template docs/how-tos/add-workspace-package.md
// names. Reading its manifest rather than literalising versions here keeps a
// generated package on whatever Renovate and syncpack currently hold, which a
// template checked into this directory would not track.
const REFERENCE_PACKAGE = join('packages', 'validation');

const TEST_ONLY_DEV_DEPENDENCIES = ['vitest', '@vitest/coverage-v8'];

const CODECOV_UPLOAD_ACTION = join('.github', 'actions', 'codecov-upload', 'action.yml');
const API_DOCKERFILE = join('apps', 'api', 'Dockerfile');
const CODECOV_CONFIG = 'codecov.yml';

interface Answers {
  name: string;
  description: string;
  displayName: string;
  tests: boolean;
  apiRuntimeDependency: boolean;
}

/**
 * Insert `block` immediately after the last entry matching `entry`.
 *
 * Throws when nothing matches. Plop's own `modify` action delegates to
 * `String.replace`, which no-ops silently on a stale pattern — the exact
 * omission this generator exists to prevent, hidden one level deeper.
 */
function insertAfterLast(source: string, entry: RegExp, block: string, what: string): string {
  const last = [...source.matchAll(entry)].at(-1);

  if (last?.index === undefined) {
    throw new Error(`${what}: nothing matched ${String(entry)}; the file's shape has changed`);
  }

  const end = last.index + last[0].length;

  return `${source.slice(0, end)}${block}${source.slice(end)}`;
}

/**
 * Insert `line` among the lines matching `sibling`, preserving their sort
 * order. Throws when nothing matches, for the reason above.
 */
function insertSorted(source: string, sibling: RegExp, line: string, what: string): string {
  const matches = [...source.matchAll(sibling)];
  const last = matches.at(-1);

  if (last?.index === undefined) {
    throw new Error(`${what}: nothing matched ${String(sibling)}; the file's shape has changed`);
  }

  const successor = matches.find((match) => match[0] > line);
  const at = successor?.index ?? last.index + last[0].length + 1;

  return `${source.slice(0, at)}${line}\n${source.slice(at)}`;
}

function edit(root: string, path: string, change: (source: string) => string): string {
  writeFileSync(join(root, path), change(readFileSync(join(root, path), 'utf8')));

  return path;
}

function writeManifest(root: string, answers: Answers): string {
  const reference = JSON.parse(
    readFileSync(join(root, REFERENCE_PACKAGE, 'package.json'), 'utf8'),
  ) as { devDependencies: Record<string, string> };

  const manifest = {
    name: `@genshin/${answers.name}`,
    version: '0.0.0',
    description: answers.description,
    private: true,
    type: 'module',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
    },
    main: './dist/index.js',
    types: './dist/index.d.ts',
    files: ['dist'],
    scripts: {
      typecheck: 'tsc --noEmit',
      build: 'tsc --project tsconfig.build.json',
      lint: 'eslint . --max-warnings=0',
      ...(answers.tests ? { test: 'vitest run' } : {}),
    },
    devDependencies: Object.fromEntries(
      Object.entries(reference.devDependencies).filter(
        ([dependency]) => answers.tests || !TEST_ONLY_DEV_DEPENDENCIES.includes(dependency),
      ),
    ),
  };

  const path = join('packages', answers.name, 'package.json');

  // This action runs before any `add`, so it owns creating the directory.
  mkdirSync(join(root, 'packages', answers.name), { recursive: true });
  writeFileSync(join(root, path), `${JSON.stringify(manifest, null, 2)}\n`);

  return path;
}

// One upload per flag: Codecov applies a report's whole coverage to every flag
// it carries, so a shared upload would report this package's coverage as the
// workspace's. The action's own comment carries the full reasoning.
function addCodecovUploads(root: string, { name }: Answers): string {
  return edit(root, CODECOV_UPLOAD_ACTION, (source) =>
    insertAfterLast(
      source,
      /^ {4}- name: Upload .+\n(?: {6}.+\n)*/gm,
      `
    - name: Upload ${name} coverage
      if: \${{ !cancelled() }}
      uses: codecov/codecov-action@fb8b3582c8e4def4969c97caa2f19720cb33a72f # v7.0.0
      with:
        token: \${{ inputs.codecov-token }}
        files: packages/${name}/coverage/lcov.info
        flags: ${name}
        fail_ci_if_error: false

    - name: Upload ${name} test results
      if: \${{ !cancelled() }}
      uses: codecov/codecov-action@fb8b3582c8e4def4969c97caa2f19720cb33a72f # v7.0.0
      with:
        token: \${{ inputs.codecov-token }}
        files: packages/${name}/test-results/junit.xml
        flags: ${name}
        report_type: test_results
        fail_ci_if_error: false
`,
      CODECOV_UPLOAD_ACTION,
    ),
  );
}

function addCodecovFlagAndComponent(root: string, { name, displayName }: Answers): string {
  return edit(root, CODECOV_CONFIG, (source) => {
    const withFlag = insertAfterLast(
      source,
      /^ {4}- name: .+\n(?: {6}.+\n)*/gm,
      `    - name: ${name}
      paths:
        - packages/${name}/src/**
`,
      `${CODECOV_CONFIG} flags`,
    );

    return insertAfterLast(
      withFlag,
      /^ {4}- component_id: .+\n(?: {6}.+\n)*/gm,
      `    - component_id: ${name}
      name: ${displayName}
      paths:
        - packages/${name}/src/**
      flag_regexes:
        - ${name}
`,
      `${CODECOV_CONFIG} components`,
    );
  });
}

// A missing COPY fails the image build on every pull request, and reports it as
// a module-resolution error rather than a missing package.
function addDockerfileCopies(root: string, { name }: Answers): string {
  return edit(root, API_DOCKERFILE, (source) => {
    const withManifest = insertSorted(
      source,
      /^COPY packages\/[^/]+\/package\.json .+$/gm,
      `COPY packages/${name}/package.json ./packages/${name}/`,
      `${API_DOCKERFILE} builder stage`,
    );

    return insertSorted(
      withManifest,
      /^COPY --from=builder \/app\/packages\/.+$/gm,
      `COPY --from=builder /app/packages/${name} ./packages/${name}`,
      `${API_DOCKERFILE} production stage`,
    );
  });
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // `turbo gen` runs plop with the repository root as its destination base,
  // whichever workspace the command was invoked from. Unlike the `turbo` object
  // plop hands to templates, this is already resolved when prompts validate.
  const root = plop.getDestBasePath();

  plop.setHelper('currentYear', () => String(new Date().getFullYear()));

  plop.setGenerator('package', {
    description: 'Scaffold a packages/<name> workspace package with its Codecov and Docker wiring',

    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Package name, without the @genshin/ scope:',
        validate: (input: string) => {
          if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input)) {
            return 'Use kebab-case; .ls-lint.yml holds every directory to it.';
          }

          if (existsSync(join(root, 'packages', input))) {
            return `packages/${input} already exists.`;
          }

          return true;
        },
      },
      {
        // Unconditional, though only the Codecov component consumes it: plop
        // refuses to bypass a conditional prompt, which would cost the
        // generator its non-interactive `--args` form.
        type: 'input',
        name: 'displayName',
        message: 'Human-readable name, for its Codecov component:',
        default: (answers: Answers) =>
          answers.name
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' '),
      },
      {
        type: 'input',
        name: 'description',
        message: 'One-line description for package.json:',
        validate: (input: string) => input.trim().length > 0 || 'A description is required.',
      },
      {
        type: 'confirm',
        name: 'tests',
        message: 'Will it have tests? (adds vitest, a Codecov flag, and a component)',
        default: true,
      },
      {
        type: 'confirm',
        name: 'apiRuntimeDependency',
        message: 'Will apps/api depend on it at runtime? (adds the Dockerfile COPY lines)',
        default: false,
      },
    ],

    actions: (data) => {
      const answers = data as Answers;
      const destination = join('packages', answers.name);

      const actions: PlopTypes.ActionType[] = [
        () => writeManifest(root, answers),
        {
          type: 'add',
          path: join(destination, 'tsconfig.json'),
          templateFile: 'templates/tsconfig.json.hbs',
        },
        {
          type: 'add',
          path: join(destination, 'tsconfig.build.json'),
          templateFile: 'templates/tsconfig.build.json.hbs',
        },
        {
          type: 'add',
          path: join(destination, 'eslint.config.js'),
          templateFile: 'templates/eslint.config.js.hbs',
        },
        {
          type: 'add',
          path: join(destination, 'src', 'index.ts'),
          templateFile: 'templates/index.ts.hbs',
        },
      ];

      if (answers.tests) {
        actions.push(
          {
            type: 'add',
            path: join(destination, 'vitest.config.ts'),
            templateFile: 'templates/vitest.config.ts.hbs',
          },
          () => addCodecovUploads(root, answers),
          () => addCodecovFlagAndComponent(root, answers),
        );
      }

      if (answers.apiRuntimeDependency) {
        actions.push(() => addDockerfileCopies(root, answers));
      }

      // The residual the generator leaves by design; see the how-to.
      const next = [
        'run `pnpm install`',
        `add "@genshin/${answers.name}": "workspace:*" to each consuming package's dependencies`,
        ...(answers.tests
          ? [`write the first test — \`vitest run\` fails while the package has none`]
          : []),
        'work the Verify section of docs/how-tos/add-workspace-package.md',
      ];

      actions.push(
        () => `\nNext:\n${next.map((step, index) => `  ${index + 1}. ${step}`).join('\n')}`,
      );

      return actions;
    },
  });
}
