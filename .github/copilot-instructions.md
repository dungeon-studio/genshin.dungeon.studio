<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.Headings = NO -->

# GitHub Copilot instructions for genshin.dungeon.studio

<!-- vale Microsoft.Headings = YES -->

AI decision rules. Human contribution guidance lives in
[`CONTRIBUTING.md`](../CONTRIBUTING.md) and
[`docs/reference/`](../docs/reference/); linters cover everything else.

Keep this filename. GitHub Copilot reads this exact path, and root
[`CLAUDE.md`](../CLAUDE.md) points here for detailed conventions. It's the only
per-repository instruction file either tool loads.

## Snapshot

- Stack: Turborepo + pnpm + TypeScript strict mode.
- Web: React, Vite, Tailwind, `shadcn/ui`, zustand, TanStack Query, `react-router-dom`.
- API: Hono + Node.js, Firestore, Firebase Auth.
- Testing: Vitest, React Testing Library, and Playwright end-to-end specs in `tools/e2e`.
- Versions live in `package.json`.
- `shadcn/ui` uses New York style, CSS variables, and ESM Tailwind plugin imports. `components.json` names the `neutral` base color, but `apps/web/src/index.css` carries a brand-derived palette.

## Repository map

- `apps/web`: Frontend app.
- `apps/api`: API server.
- `packages/game-data`: Source of truth for static game data; use exported helpers, never hard-code.
- `packages/domain`: Shared domain model: types, invariants, and wire format representations.
- `tools/game-data-codegen`: CLI that generates `game-data` sources like `weapons.generated.ts` from `genshin-db`. Never hand-edit generated files.

## Core coding rules

- Use strict TypeScript. No `any` without a justifying comment, no non-null assertion (`!`) without one, and no `@ts-ignore` without an issue reference.
- Use `import type` for type-only imports, and prefer named exports unless a framework requires a default.
- Extract reusable patterns after the third repetition.
- Prefer runtime modules over type-only packages; emit JavaScript with declarations.
- Workspace packages consumed by other packages must expose `types` and `default` in `exports` and include `main`.
- Use ISO 8601 strings for timestamps such as `createdAt` and `updatedAt`, not `Date` objects.
- Never leave `console.log` in production code; use structured logging or remove it.
- Use zustand for UI state, TanStack Query for server state, and `@genshin/game-data` helpers for static game data. Don't put async or fetch logic in a zustand store.
- For comments, documentation strings, naming, React components, and test structure, follow [Code conventions](../docs/reference/code-conventions.md).

## Build and CI rules

- Always use `pnpm turbo run <task>` for `build`, `typecheck`, and `test` in CI, Docker, and deploy workflows. Never use raw `pnpm --filter <pkg> <task>` for these because pnpm doesn't automatically build workspace dependencies first; turbo handles dependency ordering via `^build` in `turbo.json`.
- The API uses `tsconfig.json` (includes tests) for typechecking and `tsconfig.build.json` (excludes tests) for emit. The build config extends `tsconfig.json`, so compiler options stay in sync automatically; only the exclude patterns differ.
- When `tsconfig.json` uses project references, type-check with `tsc -b --noEmit`. Plain `tsc --noEmit` won't follow references.
- A new project-wide check belongs in `.pre-commit-config.yaml`, which `ci.yml` runs over the whole tree. The `runCmd` chain in `devcontainer.yml` exercises the built image's toolchain instead, so it takes a command only when nothing else in the chain runs that tool.

## API design rules

- Use the [REST API conventions reference](../docs/reference/rest-api-conventions.md) for route shape, methods, status codes, error format, pagination, and auth handling.
- All error responses use RFC 9457 Problem Details (`application/problem+json`) via `apps/api/src/http/problem.ts`. Always include a `detail` field, even for generic errors, to keep a stable schema for clients.
- List endpoints use cursor-based pagination (`limit` and `cursor`).
- Prefer explicit types over type munging. For example, define `ProfileUpdate` rather than using `Partial<Pick<UserProfile, 'name'>>` inline.
- Keep route handlers thin, compose middleware, and validate inputs at the boundary.

## Schema module conventions

- Define each JSON Schema as a typed TypeScript module in `apps/api/src/profiles/json-schema/{module}/`, not a `.json` file.
- Export a single `const` using `as const satisfies JsonSchemaProfile` from `@/profiles/json-schema/json-schema-profile.js`.
- Name files `{method}-{direction}-v{n}.ts` (for example, `get-response-v1.ts`, `put-request-v1.ts`). `{method}` is the lowercase HTTP method and `{direction}` is `request` or `response`. The serving path mirrors the filename: `/profiles/json-schema/{module}/{method}-{direction}-v{n}.json`. See [DSGEP-005](../docs/explanation/dsgep-005-schema-direction-segment.md).
- Register every schema module in `apps/api/src/profiles/json-schema/registry.ts`. The registry completeness test discovers files on disk and asserts the registry contains each one.
- The schema route stamps `$id` from the request origin at serve time. Don't declare `$id` in schema modules.

## Testing

Test alongside code. What to assert is in the testing principles in
[`CONTRIBUTING.md`](../CONTRIBUTING.md); how to shape a test is in
[Code conventions](../docs/reference/code-conventions.md). Read both before
writing tests.

## Frontend rules

- Prefer composition over inheritance and use early returns for conditional rendering.
- Use semantic HTML: proper heading hierarchy, structural elements, and native interactive elements (`<button>`, not `<div onClick>`).
- Mark decorative Lucide icons with `aria-hidden="true"` and `focusable={false}`. Icons inside labeled buttons, or adjacent to labeled inputs, are decorative.
- Use aliases such as `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils`.
- `shadcn/ui` gotchas:
  - Use ESM imports in Tailwind or Vite config (`import ...`), not `require()`.
  - Keep Vite starter CSS dark-mode defaults removed from `apps/web/src/index.css`; don't reintroduce `color-scheme` or `prefers-color-scheme` defaults.
  - Keep semantic slots semantic: `CardTitle` should render heading tags such as `h3`, and `CardDescription` should render paragraph tags such as `p`.
  - `react-refresh/only-export-components` with `allowConstantExport: true` can still flag valid `shadcn` patterns that export a component and helper; targeted suppression is acceptable.

## Dependencies and linting

- Pin exact versions without `^` or `~` prefixes; Renovate handles updates. Ask before adding a dependency.
- Root `package.json` is the source of truth for shared tooling: turbo, TypeScript, ESLint, Prettier, and Stylelint. Workspace `package.json` holds app-specific dependencies, and a tool appearing in both keeps identical versions.
- Declare every direct import explicitly, even when the same package exists at the root. Enforced by `import-x/no-extraneous-dependencies` in every workspace `eslint.config.js`; `devDependencies` may appear in test files (`*.test.ts`, `**/test/**`) and tooling configs (`eslint.config.js`, `*.config.{ts,js}`) but never in production source.
- Classify packages correctly: `dependencies` for runtime code shipped to production, `devDependencies` for build tools, plugins, type definitions, and local tooling.
- `pnpm-workspace.yaml` declares workspace package globs and engine constraints only; don't use it for version overrides.
- Run `pnpm install` and commit `pnpm-lock.yaml` after dependency changes. Use `pnpm why <package>` to detect duplicate transitive versions.
- New workspace packages should match the root `package.json` metadata fields (`description`, `keywords`, `author`, `homepage`, `bugs`, `license`).
- ESLint uses flat config via workspace-local `eslint.config.js` files; configure ignore patterns with `ignores`, not `.eslintignore`.

## Documentation rules

- Place guidance at the highest-priority location that fits, following the documentation strategy in [Code conventions](../docs/reference/code-conventions.md). Don't duplicate guidance across files; link to the canonical source.
- Keep docs accurate to `HEAD`: verify dependencies, command availability, and feature status. State plans explicitly as planned or not yet implemented.
- Every source file needs SPDX headers. For files without comment syntax, declare them in `.reuse/dep5`; see [How to add SPDX headers to new files](../docs/how-tos/add-spdx-headers.md).
- Wrap file and directory paths in backticks in prose and YAML metadata (for example, `apps/web`, `packages/game-data/src/index.ts`). Markdown link targets don't need backticks.
- When adding features, keep these descriptions in sync: `package.json` `description`, `README.md` tagline or summary, and `CONTRIBUTING.md` references to commands or scripts.

### Vale

- Run Vale through pre-commit (`pre-commit run vale --all-files`), not `vale .`. Vale has no directory-ignore mechanism and scans everything, including `node_modules`. For targeted checks, use `vale <filename>` directly.
- Handle output in order: review every suggestion one by one and either apply it or make an explicit, reasoned decision not to; then fix all warnings; then fix all errors, which are commit-blocking. Never bulk-ignore suggestions or skip the suggestions pass.
- `Microsoft.Dashes` flags em dashes adjacent to backtick-wrapped text as having spaces. Rephrase to avoid the adjacency rather than suppressing the rule.
- When `Vale.Terms` enforces casing for a term such as `cacheable`, the Vale rule wins over prose formatting conventions like capitalized bold labels.
- Categorize a flagged term by type:
  - Proper nouns (products, tools, libraries, people, conferences): add to `.styles/config/vocabularies/Project/accept.txt`.
  - Prose terms (technical English such as `monorepo`; naming conventions such as `camelCase`): add to `accept.txt`.
  - Code identifiers (field names such as `createdAt`, function names such as `toDocument()`, variable names): wrap in backticks in prose, never in `accept.txt`. Vale skips backtick-wrapped content.
  - Case corrections and preference enforcement (`firebase` to `Firebase`, `npm` to `pnpm`): add to `reject.txt` as substitution rules.
- Don't modify third-party Vale styles generated under `.styles/`, except `.styles/config/`.

## Changelog rules

- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with sections relative to the previous release rather than the previous commit.
- Write entries from the user's perspective: what someone using the app can see or do. One bullet per user-visible change.
- Leave out infrastructure, CI/CD, developer tooling, dependency updates, refactors, and internal package changes. Those are invisible to users.
- Don't name technology choices such as "zustand store" or "TanStack Query" unless the user interacts with that technology directly.
- Before the first release, only **Added** applies; the other sections need a released baseline to compare against.

## Workflow guardrails

- Never bypass pre-commit with `--no-verify`; fix root causes.
- Run `pnpm typecheck` manually because it's not part of local pre-commit hooks.
- Never use `git commit --amend` or `git push --force`.
- Fixes after hook failures should be new commits; squash merge handles cleanup.
- Track issue dependencies only with native GitHub issue relationships (`blocked by` and `is blocking`), not issue body text or comments.
- Prefer filing follow-up issues for out-of-scope concerns over expanding a pull request.
- Evaluate automated review suggestions critically. Verify a suggestion actually solves the stated problem before applying it.
- Check the codebase before assuming, and check issues and milestones before starting work.

## Shell script rules

- Start Bash scripts with `set -euo pipefail` and `set -x`.
- Use `curl -fsSL` for network fetches.
- Never hard-code secrets; use environment variables.
- Quote `${{ inputs.* }}` expansions in GitHub Actions composite action `run` steps to prevent shell word-splitting.

## DevContainer rules

- Provision a tool through a `devcontainer.json` feature when one publishes it. The image build caches a feature; every step in `.devcontainer/postCreateCommand.sh` runs again on each container create.
- Add a `postCreateCommand.sh` step when no feature publishes the tool, or when the step needs the checked-out repository. Dependency installs, hook installs, and workspace-pinned browsers belong there for that second reason.
- Give every provisioned tool a `verify` and a `print_version` entry in `.devcontainer/lib.sh`, whichever mechanism installed it. Both lifecycle scripts exit non-zero on a failed check, so an unverified tool breaks on a contributor's machine rather than in the `Devcontainer / Verify toolchain` job.

## Playwright MCP rules

Save screenshots to `/tmp/` (for example, `/tmp/dark-mode.png`), never to the
workspace, so the repo stays clean without gitignore entries. The server itself
is configured in `.vscode/mcp.json`.

## Infrastructure rules

- GCP projects use `dungeon-studio-genshin-{env}`; `shared` and `core` are production-grade infrastructure.
- Apply environment labels on creation with `gcloud alpha projects update --update-labels=environment=VALUE`.
- Enable Google Cloud APIs on demand when required by active work.
- The Terraform version is set once per workflow as the `TERRAFORM_VERSION` environment variable. When changing it, keep every workflow that declares it aligned.
- Terraform files need SPDX headers using `#` comment syntax. Never hard-code secrets; use environment variables.

## Docker rules

- Don't hard-code the pnpm version in the Dockerfile. Copy `package.json` first and use `corepack install` so corepack reads the `packageManager` field.
- When adding workspace package dependencies to an app, verify `.dockerignore` doesn't exclude them from the build context.
- Set `ENV CI=true` in builder stages so pnpm runs non-interactively.

## File naming

`.ls-lint.yml` holds the per-extension casing rules and enforces them. Two
conventions it can't express:

- React component files are `kebab-case` like every other file, but component _identifiers_ stay `PascalCase` (`character-card.tsx` exports `function CharacterCard() {}`).
- Co-located test files mirror their source and use the `.test.` suffix, not `.spec.`: `use-auth.ts` becomes `use-auth.test.ts`.
