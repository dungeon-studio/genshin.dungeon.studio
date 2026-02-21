<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# GitHub Copilot instructions for genshin.dungeon.studio

> AI-only guidance. Keep this file short and actionable; linters and CONTRIBUTING.md handle the rest.

## Snapshot

- Stack: Turborepo + pnpm + TypeScript 5.9 strict mode.
- Web: React 19, Vite, Tailwind, `shadcn/ui`, zustand, TanStack Query, `react-router-dom`.
- API: Hono + Node.js.
- Not yet implemented: Firestore, Firebase Auth, Claude MCP, Vitest, React Testing Library, Bun.
- `shadcn/ui` setup: New York style, neutral base color, CSS variables, and ESM Tailwind plugin imports.

## Repository map

- `apps/web`: Frontend app.
- `apps/api`: API server.
- `packages/game-data`: Source of truth for static game data; use exported helpers, never hard-code.
- `packages/types`: Shared types.

## Core coding rules

- Use strict TypeScript and keep components/functions focused.
- Extract repeated patterns after the third repetition.
- Prefer runtime modules over type-only packages; emit JavaScript with declarations.
- Workspace packages consumed by other packages must expose `types` and `default` in `exports` and include `main`.
- Use ISO 8601 strings for timestamps (`createdAt`, `updatedAt`, and similar), not `Date` objects.
- Maintain game-data accuracy when working with `packages/game-data`.
- Test alongside code when possible; automated test stack is planned, so perform manual local validation now.

## State usage

- Use zustand for UI state, TanStack Query for server state, and `@genshin/game-data` helpers for static game data.

## Frontend rules

- Prefer composition over inheritance and use early returns for conditional rendering.
- Use semantic HTML: proper heading hierarchy, structural elements, and native interactive elements.
- Use aliases (`@/components`, `@/components/ui`, `@/lib`, `@/lib/utils`).
- `shadcn/ui` gotchas:
  - Use ESM imports in Tailwind or Vite config (`import ...`), not `require()`.
  - Remove conflicting Vite starter CSS dark-mode defaults from `apps/web/src/index.css`.
  - Keep semantic slots semantic: `CardTitle` should render heading levels and `CardDescription` should render paragraph text.
  - `react-refresh/only-export-components` with `allowConstantExport: true` can still flag valid `shadcn` patterns that export a component and helper; targeted suppression is acceptable.

## Dependencies and linting

- `package.json` is source of truth; run `pnpm install` and commit `pnpm-lock.yaml` after dependency changes.
- Every import must exist in `dependencies` or `devDependencies`.
- Classify packages correctly:
  - `dependencies`: runtime code shipped to production.
  - `devDependencies`: build tools, plugins, type definitions, and local tooling.
- Use `pnpm why <package>` to detect duplicate transitive versions and pin when needed.
- ESLint uses flat config only (`eslint.config.js`) and `ignores` instead of `.eslintignore`.

## Documentation rules

- Put information in the right place:
  - `CONTRIBUTING.md` for human workflow guidance.
  - `.github/copilot-instructions.md` for AI decision rules.
  - `docs/` for task-specific how-tos and deeper explanations.
- Prefer this order when documenting decisions: inline comments, documentation strings, updates to existing docs, then new long-form docs.
- Keep docs accurate to `HEAD`: verify dependencies, command availability, and feature status.
- Handle Vale output in this order:
  1. Process suggestions first: review every suggestion one by one, then either apply it or make an explicit, reasoned decision not to apply it.
  2. Fix all warnings second.
  3. Fix all errors last (commit-blocking before commit).
  4. Never bulk-ignore suggestions or skip the suggestions pass.
- For valid product and tool names flagged by Vale, update `.styles/config/vocabularies/Project/accept.txt`.
- Don't modify third-party Vale styles generated under `.styles/` (except `.styles/config/`).
- Every source file needs SPDX headers; for files without comment syntax, declare in `.reuse/dep5` (see [add-spdx-headers.md](../docs/how-tos/add-spdx-headers.md)).
- Documentation principles:
  - Prefer concise, factual, present-tense writing.
  - Keep guidance implementation-oriented, not aspirational.
  - Avoid duplicating long guidance across files; link to canonical docs instead.
  - State plans explicitly as planned or not yet implemented.

## Workflow guardrails

- Never bypass pre-commit with `--no-verify`; fix root causes.
- Run `pnpm typecheck` manually because it's not part of local pre-commit hooks.
- Never use `git commit --amend` or `git push --force`.
- Fixes after hook failures should be new commits; squash merge handles cleanup.

## Shell script rules

- Start Bash scripts with `set -euo pipefail` and `set -x`.
- Use `curl -fsSL` for network fetches.
- Never hard-code secrets; use environment variables.
- Add new DevContainer provisioning steps in `.devcontainer/postCreateCommand.sh`.

## Infrastructure rules

- GCP projects use `dungeon-studio-genshin-{env}`; `shared` and `core` are production-grade infrastructure.
- Apply environment labels on creation with `gcloud alpha projects update --update-labels=environment=VALUE`.
- Enable Google Cloud APIs on demand when required by active work.
- Keep Terraform version aligned across:
  - `.github/workflows/terraform-plan.yml`
  - `.github/workflows/terraform-apply.yml`
  - `.github/workflows/pre-commit.yml` (when Terraform is used)
- Current Terraform version baseline: `1.9.0`.

## File naming

- Non-React TypeScript: lowercase (`user.ts`) or camelCase compounds (`teamMember.ts`).
- React components: PascalCase (`HomePage.tsx`).
- `shadcn/ui` components: lowercase (`button.tsx`, `card.tsx`).

## When unsure

- Check issues and milestones first.
- Check the codebase before assuming.
- Ask before adding dependencies.
