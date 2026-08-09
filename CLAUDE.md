<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# genshin.dungeon.studio

AI-powered team building companion for Genshin Impact.

## Stack

Turborepo + pnpm monorepo. TypeScript strict mode throughout. Versions live
in `package.json` files.

- **Web**: React, Vite, Tailwind, shadcn/ui, zustand, TanStack Query, react-router-dom
- **API**: Hono + Node.js, Firestore, Firebase Auth, Vitest

## Repository structure

- `apps/web/` --- Frontend (Vite dev server, port 5173)
- `apps/api/` --- API server (Hono, port 8080)
- `packages/domain/` --- Shared domain model and branded types
- `packages/game-data/` --- Static game data; use exported helpers, never hard-code
- `packages/collection-json/`, `packages/validation/`
- `tools/game-data-codegen/` --- generates `game-data` sources from `genshin-db`
- `infrastructure/` --- Terraform IaC
- `docs/` --- Diátaxis-organized how-tos, references, explanations

## Commands

```bash
pnpm dev          # Start all dev servers + Firebase emulators
pnpm build
pnpm typecheck    # not in pre-commit; run manually
pnpm test
pnpm lint
pnpm format
pnpm reuse:check  # SPDX license compliance check
```

Always use `pnpm turbo run <task>` for `build`, `typecheck`, and `test`. Never
use raw `pnpm --filter <pkg> <task>` because pnpm doesn't automatically build
workspace dependencies first. Turbo handles dependency ordering via `^build`.

## Key rules

- Every source file needs SPDX headers. See `docs/how-tos/add-spdx-headers.md`.
  For files without comment syntax, declare them in `.reuse/dep5`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`,
  `perf:`, `test:`, `build:`, `ci:`, `chore:`, `revert:`. CI checks the PR
  title, not local commits; subject starts lowercase, no trailing period.
- Never bypass pre-commit with `--no-verify`; fix root causes.
- Never use `git commit --amend` or `git push --force`.
- Fixes after hook failures should be new commits; squash merge handles cleanup.
- At session start, check `git status` for pre-existing `M` files outside your
  task's scope; don't attribute their breakage to your changes.
- After changing `pnpm-lock.yaml`, run `pnpm install` and restart any running
  dev server. Vite caches module resolution at startup, so a stale server throws
  misleading `Cannot find module` errors.
- Sessions run on the host, not in the project's container, so pnpm, Firebase
  CLI, pre-commit, Vale, REUSE, and Playwright may be absent. Check availability
  before relying on a tool; note it as missing rather than failing.
- Run `pre-commit run vale --all-files` for Vale, not `vale .`. Vale has no
  directory-ignore and scans `node_modules`.
- API error responses use RFC 9457 Problem Details, `application/problem+json`.
- Testing: follow the Testing section in `CONTRIBUTING.md` (test behavior not
  values, `satisfies` for fixtures, one schema assertion per route test then a
  spot check).

## Detailed coding rules

See `.github/copilot-instructions.md` for comprehensive conventions covering API
design, frontend patterns, schema modules, infrastructure, Docker, and more.
