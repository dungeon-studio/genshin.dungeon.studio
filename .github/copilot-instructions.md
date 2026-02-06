# GitHub Copilot instructions for Genshin Dungeon Studio

> AI-only guidance for decision-making context. Linters and CONTRIBUTING.md handle the rest.

## Tech stack

- Turborepo + pnpm, TypeScript 5.9 strict mode
- **Web**: React 19 + Vite + Tailwind + shadcn/ui, zustand, react-query, react-router-dom
- **API**: Hono + Node.js
- **Testing**: Vitest (React Testing Library not yet installed)

## Not yet implemented

- Firestore, Firebase Auth, Claude MCP, React Testing Library, Bun

## monorepo structure

- **packages/types**: Shared types across apps
- **packages/game-data**: Static game data (characters, artifacts, reactions, weapons). Source of truth: wiki. Version = game version. Use exported helpers (for example, `getCharacterById()`), never hard-code. Accuracy validated via manual local development; add automated tests when a test suite exists.
- **apps/web**: React frontend
- **`apps/api`**: Hono API server

## State & storage patterns

- **UI state**: zustand
- **Server state**: react-query
- **Persistent**: `localStorage` (Progressive Web App, planned long-term)
- **Long-term**: Firestore (planned)
- Game data: Import from `@genshin/game-data`, use helpers

## API & error handling

- HTTP status codes with user-actionable error messages
- Logging: console.log today; structured JSON logging planned for Observability tools/Grafana Cloud
- Frontend: try/catch with console.error

## Testing

- Vitest for tests
- Structure: co-located with source (Component.tsx + Component.test.tsx), grouped by function/method
- Coverage: 80%+ core, 90%+ utilities
- Test behavior, not implementation; manual local validation required before push

## Dependencies

- package.json is source of truth
- After changes: `pnpm install` + commit pnpm-lock.yaml
- Every import must exist in dependencies/devDependencies
- Don't add without asking

## Pre-commit hooks

**Never bypass pre-commit hooks** with `--no-verify`. If hooks fail, fix the underlying issues instead:

- Vale errors: Fix prose directly or use line-level suppression comments if false positive
- ESLint/Stylelint errors: Run `pnpm lint --fix` to resolve most issues
- TypeScript errors: Fix type issues properly; no escape hatches
- Secrets detected: Remove and use environment variables or secure storage

Bypassing hooks masks problems that will fail in CI anyway.

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
