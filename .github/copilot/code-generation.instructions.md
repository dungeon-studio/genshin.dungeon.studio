<!-- SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> -->
<!-- SPDX-License-Identifier: MIT -->

# Code generation instructions

## General

- Start every source file with the SPDX header appropriate to the file type.
- Use strict TypeScript; never use `any` unless truly unavoidable, and add a
  justifying comment when it is.
- Prefer named exports; use default exports only when a framework requires them.
- Use `import type` for type-only imports.
- End files with a trailing newline.
- Wrap file and directory paths in backticks when they appear in prose or
  YAML metadata (for example, `apps/web`, `docs/how-tos/`).
- Single quotes, 100-character print width, 2-space indentation (Prettier
  handles this, but generate compliant code).

## React components (`apps/web`)

- Use function declarations (`export function MyComponent()`) for page and
  layout components.
- Use `const` with `React.forwardRef` only for `shadcn/ui` primitives.
- Colocate small helper components in the same file as private functions (not
  exported).
- Use early returns for guard clauses and conditional rendering.
- Use semantic HTML: headings in order, `<nav>`, `<main>`, `<footer>`,
  `<button>` (not `<div onClick>`).
- Use `@/components`, `@/components/ui`, `@/lib`, and `@/lib/utils` path
  aliases.
- Apply Tailwind utility classes directly; avoid inline `style` objects.
- Use `cn()` from `@/lib/utils` to merge conditional class names.

## Hono API routes (`apps/api`)

- Follow REST conventions in `docs/reference/rest-api-conventions.md`.
- Use `HTTPException` for errors; the global error handler formats the
  response. The API plans to migrate to `application/problem+json` (RFC 9457).
- Use middleware composition; keep route handlers thin.
- Validate inputs at the boundary.

## Shared packages

- `@genshin/game-data`: export data arrays (for example, `CHARACTERS`) and
  getter helpers (for example, `getCharacterById`). Export relevant types
  alongside data.
- `@genshin/types`: export only `type` declarations. No runtime code.

## State management (`apps/web`)

- **UI state**: zustand stores. Keep stores small and focused.
- **Server state**: TanStack Query. Use query keys consistently.
- **Static game data**: import from `@genshin/game-data`. Never duplicate game
  data in component files.

## Dependencies

- Only import packages that exist in the consuming package's `package.json`.
- Classify correctly: `dependencies` for runtime, `devDependencies` for build
  tooling.
