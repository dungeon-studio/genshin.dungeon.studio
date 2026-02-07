# GitHub Copilot instructions for Genshin Dungeon Studio

> AI-only guidance for decision-making context. Linters and CONTRIBUTING.md handle the rest.

## Tech stack

- Turborepo + pnpm, TypeScript 5.9 strict mode
- **Web**: React 19 + Vite + Tailwind + shadcn/ui, zustand, TanStack Query, react-router-dom
- **API**: Hono + Node.js
- **Testing**: Not yet installed (Vitest and React Testing Library planned)

## Not yet implemented

- Firestore, Firebase Auth, Claude MCP, Vitest, React Testing Library, Bun

## Repository structure

- **packages/types**: Shared types across apps
- **packages/game-data**: Static game data (characters, artifacts, reactions, weapons). Source of truth: wiki. Version = game version. Use exported helpers (for example, `getCharacterById()`), never hard-code. Accuracy validated via manual local development; add automated tests when a test suite exists.
- **apps/web**: React frontend
- **`apps/api`**: Hono API server

## State & storage patterns

- **UI state**: zustand
- **Server state**: TanStack Query
- **Persistent**: `localStorage` (Progressive Web App, planned long-term)
- **Long-term**: Firestore (planned)
- Game data: Import from `@genshin/game-data`, use helpers

## API & error handling

- HTTP status codes with user-actionable error messages
- Logging: console.log today; structured JSON logging planned for Observability tools/Grafana Cloud
- Frontend: try/catch with console.error

## Testing

- Not yet configured (Vitest planned)
- When implemented: co-locate with source (Component.tsx + Component.test.tsx), group by function/method
- Coverage targets: 80%+ core, 90%+ utilities
- Manual local validation required before push

## Dependencies

- package.json is source of truth
- After changes: `pnpm install` + commit pnpm-lock.yaml
- Every import must exist in dependencies/devDependencies
- Don't add without asking

## Pre-commit hooks

**Never bypass pre-commit hooks** with `--no-verify`. If hooks fail, fix the underlying issues instead. Fix prose for Vale errors, rerun linters with `--fix`, resolve TypeScript errors properly, and move secrets to environment variables. Local pre-commit hooks run the full set on every commit; pre-commit.ci runs all hooks on PRs except ESLint, Stylelint, and TypeScript checks (which GitHub Actions handles). Bypassing local hooks masks problems that pre-commit.ci will catch.

## Git workflow

**Never use `git commit --amend` or `git push --force`**. This repository uses squash merge, so:

- Each commit can be rough; pre-commit hooks will catch issues
- If hooks fail, make a new commit with fixes rather than amending
- All commits become one on merge anyway
- Force pushes rewrite history unnecessarily and can lose work

Just commit fixes normally and push. Amend/force-push workflows are unnecessary overhead here.

## When suggesting code

**Do**: Test alongside code; strict TypeScript; domain-driven design; maintain game-data accuracy; verify docs match code; cross-platform compatible

**Don't**: Add new dependencies without review; use deprecated React; skip error/logging; hard-code game values; document unimplemented features; suggest Bun; make OS assumptions

## Documentation preference hierarchy

When explaining decisions or complex patterns, prefer this order:

1. **Inline comments** - In the actual code where decisions are made
2. **Documentation strings** - On functions/classes/modules when inline isn't sufficient
3. **Updates to existing docs** - Modify CONTRIBUTING.md or existing how-tos if applicable
4. **New long-form documentation** - Only create if none of the above fit

<!-- vale alex.Condescending = NO -->

Rationale: Comments stay with code through refactors. Long form documentation gets stale and duplicates linter-enforced rules.

<!-- vale alex.Condescending = YES -->

## When unsure

- Check GitHub Issues/Milestones first
- Ask before adding dependencies
- Verify against codebase, don't assume
