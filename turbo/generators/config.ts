// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import type { PlopTypes } from '@turbo/gen';

const SCOPE = '@genshin';
const PACKAGES_DIRECTORY = 'packages';

// Read at run time rather than literalised in a template: neither Renovate nor
// syncpack reaches into a .hbs, so a pinned version here would start rotting.
const REFERENCE_PACKAGE = 'validation';

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

interface Entry {
  text: string;
  start: number;
  end: number;
}

interface Anchors {
  all: Entry[];
  last: Entry;
}

const scopedName = (name: string): string => `${SCOPE}/${name}`;

const packageDirectory = (name: string): string => join(PACKAGES_DIRECTORY, name);

const splice = (source: string, at: number, text: string): string =>
  `${source.slice(0, at)}${text}${source.slice(at)}`;

// Plop's own `modify` action delegates to `String.replace`, which no-ops
// silently on a stale pattern. Throwing is what keeps a missed injection from
// reporting itself as a success.
function anchorsIn(source: string, pattern: RegExp, context: string): Anchors {
  const all = [...source.matchAll(pattern)].map((match) => ({
    text: match[0],
    start: match.index,
    end: match.index + match[0].length,
  }));

  const last = all.at(-1);

  if (last === undefined) {
    throw new Error(`${context}: nothing matched ${String(pattern)}; the file's shape has changed`);
  }

  return { all, last };
}

function insertAfterLast(source: string, pattern: RegExp, block: string, context: string): string {
  return splice(source, anchorsIn(source, pattern, context).last.end, block);
}

function insertSorted(source: string, pattern: RegExp, line: string, context: string): string {
  const { all, last } = anchorsIn(source, pattern, context);
  const successor = all.find((entry) => entry.text > line);

  return splice(source, successor ? successor.start : last.end + 1, `${line}\n`);
}

// Plop prints an action's return value as its change log.
function rewriteFile(root: string, path: string, change: (source: string) => string): string {
  const absolute = join(root, path);

  writeFileSync(absolute, change(readFileSync(absolute, 'utf8')));

  return path;
}

function referenceDevDependencies(root: string, tests: boolean): Record<string, string> {
  const reference = JSON.parse(
    readFileSync(join(root, packageDirectory(REFERENCE_PACKAGE), 'package.json'), 'utf8'),
  ) as { devDependencies: Record<string, string> };

  const wanted = ([dependency]: [string, string]): boolean =>
    tests || !TEST_ONLY_DEV_DEPENDENCIES.includes(dependency);

  return Object.fromEntries(Object.entries(reference.devDependencies).filter(wanted));
}

function manifestFor(answers: Answers, devDependencies: Record<string, string>): object {
  return {
    name: scopedName(answers.name),
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
    devDependencies,
  };
}

function writeManifest(root: string, answers: Answers): string {
  const manifest = manifestFor(answers, referenceDevDependencies(root, answers.tests));
  const path = join(packageDirectory(answers.name), 'package.json');

  // This action runs before any `add`, so it owns creating the directory.
  mkdirSync(join(root, packageDirectory(answers.name)), { recursive: true });
  writeFileSync(join(root, path), `${JSON.stringify(manifest, null, 2)}\n`);

  return path;
}

// Codecov needs one upload per flag; the action's own comment explains why.
function addCodecovUploads(root: string, { name }: Answers): string {
  return rewriteFile(root, CODECOV_UPLOAD_ACTION, (source) =>
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
  return rewriteFile(root, CODECOV_CONFIG, (source) => {
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

// A missing COPY fails the image build on every pull request, reporting a
// module-resolution error rather than a missing package. Both lists are kept
// sorted, hence insertSorted over appending.
function addDockerfileCopies(root: string, { name }: Answers): string {
  return rewriteFile(root, API_DOCKERFILE, (source) => {
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

/** Each template is named for the file it produces, under `templates/`. */
function addTemplate(name: string, file: string): PlopTypes.ActionType {
  return {
    type: 'add',
    path: join(packageDirectory(name), file),
    templateFile: join('templates', `${basename(file)}.hbs`),
  };
}

function titleCase(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function packagePrompts(root: string): PlopTypes.PromptQuestion[] {
  return [
    {
      type: 'input',
      name: 'name',
      message: `Package name, without the ${SCOPE}/ scope:`,
      validate: (input: string) => {
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(input)) {
          return 'Use kebab-case; .ls-lint.yml holds every directory to it.';
        }

        if (existsSync(join(root, packageDirectory(input)))) {
          return `${packageDirectory(input)} already exists.`;
        }

        return true;
      },
    },
    {
      // Asked even when nothing consumes it: plop refuses to bypass a
      // conditional prompt, which would cost the generator its `--args` form.
      type: 'input',
      name: 'displayName',
      message: 'Human-readable name, for its Codecov component:',
      default: (answers: Answers) => titleCase(answers.name),
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
  ];
}

function scaffoldActions(root: string, answers: Answers): PlopTypes.ActionType[] {
  const files = [
    'tsconfig.json',
    'tsconfig.build.json',
    'eslint.config.js',
    join('src', 'index.ts'),
    ...(answers.tests ? ['vitest.config.ts'] : []),
  ];

  return [
    () => writeManifest(root, answers),
    ...files.map((file) => addTemplate(answers.name, file)),
  ];
}

function wiringActions(root: string, answers: Answers): PlopTypes.ActionType[] {
  return [
    ...(answers.tests
      ? [() => addCodecovUploads(root, answers), () => addCodecovFlagAndComponent(root, answers)]
      : []),
    ...(answers.apiRuntimeDependency ? [() => addDockerfileCopies(root, answers)] : []),
  ];
}

function nextSteps({ name, tests }: Answers): string {
  const steps = [
    'run `pnpm install`',
    `add "${scopedName(name)}": "workspace:*" to each consuming package's dependencies`,
    ...(tests ? ['write the first test — `vitest run` fails while the package has none'] : []),
    'work the Verify section of docs/how-tos/add-workspace-package.md',
  ];

  return `\nNext:\n${steps.map((step, index) => `  ${index + 1}. ${step}`).join('\n')}`;
}

export default function generator(plop: PlopTypes.NodePlopAPI): void {
  // `turbo gen` sets the destination base to the repository root, whichever
  // workspace the command ran from.
  const root = plop.getDestBasePath();

  plop.setHelper('currentYear', () => String(new Date().getFullYear()));

  plop.setGenerator('package', {
    description: `Scaffold a ${PACKAGES_DIRECTORY}/<name> workspace package with its Codecov and Docker wiring`,
    prompts: packagePrompts(root),
    actions: (data) => {
      const answers = data as Answers;

      return [
        ...scaffoldActions(root, answers),
        ...wiringActions(root, answers),
        () => nextSteps(answers),
      ];
    },
  });
}
