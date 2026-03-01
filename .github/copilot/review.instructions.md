<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Code review instructions

Use these rules when reviewing pull requests or code selections. Flag
violations as review comments with a brief explanation and a suggested fix.

## TypeScript strictness

- No implicit or explicit `any`. If `any` is unavoidable, require a justifying
  comment.
- Use `import type` for type-only imports.
- Ensure strict mode is honored: no non-null assertions (`!`) without
  justification, no `@ts-ignore` without an accompanying issue reference.

## SPDX headers

- Every source file must start with the SPDX header appropriate to its file
  type. For files that can't have inline headers, verify they're declared in
  `.reuse/dep5`.

## Dependency classification

- Imports must exist in the consuming package's `package.json`.
- `dependencies`: runtime code shipped to production.
- `devDependencies`: build tools, plugins, type definitions, and local tooling.
- Flag misclassified packages.

<!-- vale Microsoft.HeadingAcronyms = NO -->

## Semantic HTML

<!-- vale Microsoft.HeadingAcronyms = YES -->

- Headings must follow proper hierarchy (no skipped levels).
- Use structural elements: `<nav>`, `<main>`, `<footer>`, `<section>`.
- Use native interactive elements (`<button>`, `<a>`, `<input>`), not
  `<div onClick>`.
- `shadcn/ui` semantic slots: `CardTitle` renders heading tags, and
  `CardDescription` renders paragraph tags.

## REST API conventions

- Routes must follow the conventions in
  `docs/reference/rest-api-conventions.md`.
- Use `HTTPException` for errors; the global error handler serializes them
  as `{ error, status }` JSON. The API plans to migrate to
  `application/problem+json` (RFC 9457).
- List endpoints must use cursor-based pagination (`limit` and `cursor`).

## Game data integrity

- Never hard-code game data (characters, weapons, artifacts, elements) in
  component or route files. Use `@genshin/game-data` helpers.
- Verify data accuracy against official sources when new entries are added.
- Data arrays must maintain alphabetical sort order.

## State management boundaries

- **UI state**: zustand stores only. Keep stores small and single-purpose.
- **Server state**: TanStack Query only. Don't put async/fetch logic in
  zustand stores.
- **Static game data**: import from `@genshin/game-data`. Don't duplicate game
  data in components or stores.

## Path aliases and imports

- Use `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils` in
  `apps/web`.
- Prefer named exports; flag default exports unless a framework requires them.

## Commit message format

- Verify PR titles follow Conventional Commits format: `type(scope): subject`.
- Subject line must use imperative mood, start with a capital letter, and omit
  a trailing period.
- Allowed types: `feat`, `fix`, `docs`, `test`, `refactor`, `style`, `chore`.

## Path formatting in prose

- File and directory paths in prose or YAML metadata must be wrapped in
  backticks (for example, `apps/web`, `packages/game-data`).
- Markdown link targets don't need backticks.

## Patterns to flag

- `console.log` left in production code (use structured logging or remove).
- Inline `style` objects in React components (use Tailwind classes).
- `fireEvent` in tests (use `userEvent` instead).
- Snapshot tests for UI components (assert on behavior and accessible roles).
- `test()` in test files (use `it()` per project convention).

## Documentation

- Verify Vale compliance: use contractions ("don't," "isn't"), em
  dashes without spaces (`word—word`), "for example" instead of Latin
  abbreviations, and inclusive language (`alex` style).
- Handle Vale output in order: suggestions first, then warnings, then errors.
- Heading hierarchy must not skip levels.
- Place files in the correct `docs/` subdirectory following Diátaxis:
  `docs/how-tos/` for tasks, `docs/reference/` for lookup material,
  `docs/explanation/` for rationale.
- Don't duplicate guidance that exists elsewhere; link to the canonical source.
- Keep docs accurate to `HEAD`: verify dependencies, commands, and feature
  status.
- For valid product or tool names flagged by Vale, add them to
  `.styles/config/vocabularies/Project/accept.txt` instead of rewriting.

## Infrastructure

- Terraform version must stay aligned across
  `.github/workflows/terraform-plan.yml`,
  `.github/workflows/terraform-apply.yml`, and
  `.github/workflows/pre-commit.yml`. Current baseline: `1.9.0`.
- GCP projects follow the naming convention
  `dungeon-studio-genshin-{env}`. `shared` and `core` are
  production-grade infrastructure.
- Apply environment labels on project creation.
- Never hard-code secrets in Terraform or scripts; use environment variables.
- Verify state storage configuration in `backend.tf` files.
- Terraform files must include SPDX headers using `#` comment syntax.
- Enable Google Cloud APIs on demand, only when required by active work.
