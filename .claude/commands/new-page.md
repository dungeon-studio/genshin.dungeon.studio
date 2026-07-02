---
description: Scaffold a new React page component in `apps/web`
argument-hint: '[PageName]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# New page component

Follow the conventions in
[`code-generation.instructions.md`](../../.github/copilot/code-generation.instructions.md).

Create a new page component, using
[`characters-page.tsx`](../../apps/web/src/pages/characters-page.tsx) as a
reference for structure and style.

## Inputs

- Page name (PascalCase): **$1**

## Requirements

1. Create the file at `apps/web/src/pages/<name>-page.tsx` with a kebab-case
   file name (for example, `CharacterDetail` becomes
   `character-detail-page.tsx`).
2. Start with the SPDX header:

   ```tsx
   // SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
   // SPDX-License-Identifier: MIT
   ```

3. Use a named function export: `export function $1Page()`.
4. Use semantic HTML with a `<div className="mx-auto max-w-7xl px-4 py-12">`
   wrapper.
5. Include an `<h1>` heading as the first visible content.
6. Add the route to [`app.tsx`](../../apps/web/src/app.tsx) inside the
   `<Route element={<Layout />}>` group.
7. Import the page from its kebab-case module:
   `import { $1Page } from './pages/<name>-page';`.
8. Run `pnpm turbo run typecheck` to verify the new route compiles.
