<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

<!-- vale Microsoft.Headings = NO -->

# GitHub Copilot instructions for genshin.dungeon.studio

<!-- vale Microsoft.Headings = YES -->

> AI-only guidance. Keep this file short and practical; linters and CONTRIBUTING.md handle the remainder.

## Snapshot

- Stack: Turborepo + pnpm + TypeScript 6.0 strict mode.
- Web: React 19, Vite, Tailwind, `shadcn/ui`, zustand, TanStack Query, `react-router-dom`.
- API: Hono + Node.js, Firestore, Firebase Auth.
- Testing: Vitest (API integration tests).
- Not yet implemented: Claude MCP, React Testing Library, Bun.
- `shadcn/ui` setup: New York style, neutral base color, CSS variables, and ESM Tailwind plugin imports.

## Repository map

- `apps/web`: Frontend app.
- `apps/api`: API server.
- `packages/game-data`: Source of truth for static game data; use exported helpers, never hard-code.
- `packages/domain`: Shared domain model: types, invariants, and wire format representations.

## Dependency management in the monorepo

- Pin exact versions without `^` or `~` prefixes; Renovate handles updates weekly.
- Root `package.json` is the source of truth for shared tooling: turbo, concurrently, TypeScript, ESLint, Prettier, and Stylelint.
- Workspace `package.json` holds app-specific dependencies. Declare every direct import explicitly, even when the same package exists at the root.
- When a shared tool appears in both root and workspace `package.json`, keep the versions identical.
- `pnpm-workspace.yaml` declares workspace package globs and engine constraints only; don't use it for version overrides.

## Core coding rules

- Use strict TypeScript and keep components/functions focused.
- Extract reusable patterns after the third repetition.
- Prefer runtime modules over type-only packages; emit JavaScript with declarations.
- Workspace packages consumed by other packages must expose `types` and `default` in `exports` and include `main`.
- Use ISO 8601 strings for timestamps such as `createdAt` and `updatedAt`, not `Date` objects.
- Maintain game-data accuracy when working with `packages/game-data`.
- Test alongside code when possible; the API has Vitest coverage, but web and UI testing is planned and not yet implemented.
- Each branded type in `packages/domain/` gets its own file (for example, `uuid.ts`, `isoTimestamp.ts`).
- Shared API test utilities go in `apps/api/src/test/` with descriptive names (not generic names like "helpers"). This directory is excluded from production builds via `tsconfig.build.json`.
- Use descriptive, specific file names. Avoid generic names like "helpers."

## Build and CI rules

- Always use `pnpm turbo run <task>` for `build`, `typecheck`, and `test` in CI, Docker, and deploy workflows. Never use raw `pnpm --filter <pkg> <task>` for these because pnpm doesn't automatically build workspace dependencies first; turbo handles dependency ordering via `^build` in `turbo.json`.
- The API uses `tsconfig.json` (includes tests) for typechecking and `tsconfig.build.json` (excludes tests) for emit. The build config extends `tsconfig.json`, so compiler options stay in sync automatically; only the exclude patterns differ.

## State usage

- Use zustand for UI state, TanStack Query for server state, and `@genshin/game-data` helpers for static game data.

## API design rules

- Use the [REST API conventions reference](../docs/reference/rest-api-conventions.md) as guidance for API route shape, methods, status codes, error format, pagination, and auth handling.
- All error responses use RFC 9457 Problem Details (`application/problem+json`). Always include a `detail` field, even for generic errors, to keep a stable schema for clients.
- Validate API success responses against the published JSON Schema in tests using AJV, not just individual field assertions. Keep one sanity-check assertion per test for a specific value.
- Prefer explicit types over type munging. For example, define `ProfileUpdate` rather than using `Partial<Pick<UserProfile, 'name'>>` inline.

## Schema module conventions

- Define each JSON Schema as a typed TypeScript module in `apps/api/src/profiles/json-schema/{module}/`, not a `.json` file.
- Export a single `const` using `as const satisfies JsonSchemaProfile` from `@/profiles/json-schema/json-schema-profile.js`.
- Name files `{method}-{direction}-v{n}.ts` (for example, `get-response-v1.ts`, `put-request-v1.ts`). `{method}` is the lowercase HTTP method and `{direction}` is `request` or `response`. The serving path mirrors the filename: `/profiles/json-schema/{module}/{method}-{direction}-v{n}.json`. See [DSGEP-005](../docs/explanation/dsgep-005-schema-direction-segment.md).
- Register every schema module in `apps/api/src/profiles/json-schema/registry.ts`. The registry completeness test discovers files on disk and asserts the registry contains each one.
- The schema route stamps `$id` from the request origin at serve time. Don't declare `$id` in schema modules.

## Frontend rules

- Prefer composition over inheritance and use early returns for conditional rendering.
- Use semantic HTML: proper heading hierarchy, structural elements, and native interactive elements.
- Mark decorative Lucide icons with `aria-hidden="true"` and `focusable={false}`. Icons inside labeled buttons, or adjacent to labeled inputs, are decorative.
- Use aliases such as `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils`.
- `shadcn/ui` gotchas:
  - Use ESM imports in Tailwind or Vite config (`import ...`), not `require()`.
  - Keep Vite starter CSS dark-mode defaults removed from `apps/web/src/index.css`; don't reintroduce `color-scheme` or `prefers-color-scheme` defaults.
  - Keep semantic slots semantic: `CardTitle` should render heading tags such as `h3`, and `CardDescription` should render paragraph tags such as `p`.
  - `react-refresh/only-export-components` with `allowConstantExport: true` can still flag valid `shadcn` patterns that export a component and helper; targeted suppression is acceptable.

## Dependencies and linting

- `package.json` is source of truth; run `pnpm install` and commit `pnpm-lock.yaml` after dependency changes.
- Every import must exist in `dependencies` or `devDependencies`.
- Classify packages correctly:
  - `dependencies`: runtime code shipped to production.
  - `devDependencies`: build tools, plugins, type definitions, and local tooling.
- Use `pnpm why <package>` to detect duplicate transitive versions and pin when needed.
- ESLint uses flat config via workspace-local `eslint.config.js` files; configure ignore patterns with `ignores`, not `.eslintignore`.

## Documentation rules

- Put information in the right place, in this priority order:
  1. Inline comments explaining _why_ code works a certain way.
  2. Documentation strings on functions or modules.
  3. `docs/` for how-tos, references, and explanations following [Diátaxis](https://diataxis.fr/).
  4. `CONTRIBUTING.md` for human workflow guidance.
  5. `.github/copilot-instructions.md` for AI decision rules.
- Prefer this order when documenting decisions: inline comments, documentation strings, updates to existing docs, then new long-form docs.
- Keep docs accurate to `HEAD`: verify dependencies, command availability, and feature status.
- Run Vale through pre-commit (`pre-commit run vale --all-files`), not `vale .`. Vale has no directory-ignore mechanism and scans everything, including `node_modules`. For targeted checks on specific files, use `vale <filename>` directly.
- Handle Vale output in this order:
  1. Process suggestions first: review every suggestion one by one, then either apply it or make an explicit, reasoned decision not to apply it.
  2. Fix all warnings second.
  3. Fix all errors last because they're commit-blocking.
  4. Never bulk-ignore suggestions or skip the suggestions pass.
- Vale's `Microsoft.Dashes` rule flags em dashes adjacent to backtick-wrapped text as having spaces. Rephrase the sentence to avoid the adjacency rather than suppressing the rule.
- When Vale's `Vale.Terms` rule enforces casing for a term such as `cacheable`, the Vale rule wins over prose formatting conventions like capitalized bold labels.
- For valid product and tool names flagged by Vale, update `.styles/config/vocabularies/Project/accept.txt`.
- Don't modify third-party Vale styles generated under `.styles/`, except `.styles/config/`.
- Every source file needs SPDX headers. For files without comment syntax, declare them in `.reuse/dep5`; see [How to add SPDX headers to new files](../docs/how-tos/add-spdx-headers.md).
- Wrap file and directory paths in backticks when they appear in prose (for example, `apps/web`, `packages/game-data/src/index.ts`). Markdown link targets don't need backticks.
- Documentation principles:
  - Prefer concise, factual, present-tense writing.
  - Keep guidance implementation-oriented, not aspirational.
  - Avoid duplicating long guidance across files; link to canonical docs instead.
  - State plans explicitly as planned or not yet implemented.

## Changelog rules

- `CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
- Write entries from the **user's perspective**. Describe what someone using Genshin Planner can see or do, not the implementation.
- Don't include infrastructure, CI/CD, developer tooling, dependency updates, refactors, or internal package changes. Those are invisible to users.
- Use the standard sections: Added, Changed, Deprecated, Removed, Fixed, Security. Each section is relative to the **previous release**, not the previous commit.
- Before the first release, only **Added** applies. Other sections require a released baseline to compare against.
- Keep entries concise. One bullet per user-visible change; combine related commits into a single entry.
- Don't mention technology choices such as "zustand store" or "TanStack Query" unless the user directly interacts with that technology.

## Workflow guardrails

- Never bypass pre-commit with `--no-verify`; fix root causes.
- Run `pnpm typecheck` manually because it's not part of local pre-commit hooks.
- Never use `git commit --amend` or `git push --force`.
- Fixes after hook failures should be new commits; squash merge handles cleanup.
- For GitHub issues, track dependencies only with native issue relationships (`blocked by` / `is blocking`), not issue body text or comments.
- Prefer filing follow-up issues for out-of-scope concerns over expanding a PR.
- Evaluate automated PR review suggestions critically. Verify that a suggestion actually solves the stated problem before applying it.

## Shell script rules

- Start Bash scripts with `set -euo pipefail` and `set -x`.
- Use `curl -fsSL` for network fetches.
- Never hard-code secrets; use environment variables.
- Quote `${{ inputs.* }}` expansions in GitHub Actions composite action `run` steps to prevent shell word-splitting.
- Add new DevContainer provisioning steps in `.devcontainer/postCreateCommand.sh`.

## Playwright MCP rules

- The Playwright MCP server is configured in `.vscode/mcp.json` and runs headless Chrome.
- Save screenshots to `/tmp/` (for example, `/tmp/dark-mode.png`), never to the workspace. This keeps the repo clean without needing gitignore entries.

## Infrastructure rules

- GCP projects use `dungeon-studio-genshin-{env}`; `shared` and `core` are production-grade infrastructure.
- Apply environment labels on creation with `gcloud alpha projects update --update-labels=environment=VALUE`.
- Enable Google Cloud APIs on demand when required by active work.
- Keep Terraform version aligned across:
  - `.github/workflows/terraform-plan.yml`
  - `.github/workflows/terraform-apply.yml`
  - `.github/workflows/pre-commit.yml`, when Terraform is in use
- Current Terraform version baseline: `1.9.0`.

## Docker rules

- Don't hard-code the pnpm version in the Dockerfile. Copy `package.json` first and use `corepack install` so corepack reads the `packageManager` field.
- When adding workspace package dependencies to an app, verify `.dockerignore` doesn't exclude them from the build context.
- Set `ENV CI=true` in builder stages so pnpm runs non-interactively.

## File naming

- Non-React TypeScript: lowercase file names like `user.ts`, or camelCase compounds like `teamMember.ts`.
- React components: PascalCase file names like `HomePage.tsx`.
- `shadcn/ui` components: lowercase file names like `button.tsx` and `card.tsx`.

## When unsure

- Check issues and milestones first.
- Check the codebase before assuming.
- Ask before adding dependencies.
