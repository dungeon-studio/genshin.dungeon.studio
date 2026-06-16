<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# genshin.dungeon.studio

AI-powered team building companion for Genshin Impact.

## Stack

Turborepo + pnpm monorepo. TypeScript 6.0 strict mode throughout.

- **Web**: React 19, Vite, Tailwind, shadcn/ui, zustand, TanStack Query, react-router-dom
- **API**: Hono + Node.js, Firestore, Firebase Auth, Vitest
- **Packages**: `domain`, `game-data`, `collection-json`, `validation`

## Repository structure

- `apps/web/` --- Frontend app (Vite dev server on port 5173)
- `apps/api/` --- API server (Hono on port 8080)
- `packages/domain/` --- Shared domain model and branded types
- `packages/game-data/` --- Static game data; use exported helpers, never hard-code
- `packages/collection-json/` --- Collection+JSON media type
- `packages/validation/` --- Validation utilities
- `tools/game-data-codegen/` --- CLI that generates `game-data` sources from `genshin-db`
- `infrastructure/` --- Terraform IaC
- `docs/` --- How-tos, references, and explanations following Diátaxis

## Commands

```bash
pnpm dev          # Start all dev servers + Firebase emulators
pnpm build        # Build all packages via turbo
pnpm typecheck    # TypeScript type checking (not in pre-commit; run manually)
pnpm test         # Run all tests
pnpm lint         # Lint all packages
pnpm format       # Format with Prettier
pnpm reuse:check  # SPDX license compliance check
```

Always use `pnpm turbo run <task>` for `build`, `typecheck`, and `test`. Never
use raw `pnpm --filter <pkg> <task>` because pnpm doesn't automatically build
workspace dependencies first. Turbo handles dependency ordering via `^build`.

## Key rules

- Every source file needs SPDX headers. See `docs/how-tos/add-spdx-headers.md`.
  For files without comment syntax, declare them in `.reuse/dep5`.
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`,
  `style:`, `chore:`.
- Never bypass pre-commit with `--no-verify`; fix root causes.
- Never use `git commit --amend` or `git push --force`.
- Fixes after hook failures should be new commits; squash merge handles cleanup.
- Run `pre-commit run vale --all-files` for Vale, not `vale .`. Vale has no
  directory-ignore and scans `node_modules`.
- API error responses use RFC 9457 Problem Details, `application/problem+json`.
- Validate API responses with published JSON Schema using AJV in tests.

## Detailed coding rules

See `.github/copilot-instructions.md` for comprehensive conventions covering API
design, frontend patterns, schema modules, infrastructure, Docker, and more.

## Claustre sessions

This project uses Claustre to orchestrate parallel Claude Code sessions in git
worktrees. If running in a Claustre-managed session:

- The working directory is a git worktree under `~/.claustre/worktrees/`, not
  the main repository clone.
- `.claustre_session_id` identifies the current session.
- Claude Code hooks in `.claude/settings.local.json` report status back to
  Claustre automatically. Don't modify these.
- Commit and push normally. Claustre tracks PR status via the stop hook.
- DevContainers tools like pnpm, Firebase CLI, pre-commit, Vale, REUSE, and
  Playwright may not be available on the host. Check tool availability before
  relying on them. If a tool is missing, note it rather than failing.
