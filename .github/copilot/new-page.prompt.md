---
description: Scaffold a new React page component in `apps/web`
agent: agent
argument-hint: Page name in PascalCase (for example, Settings or CharacterDetail)
tools: ['editFiles', 'codebase', 'runInTerminal']
---

# New page component

Follow the conventions in [code-generation.instructions.md](code-generation.instructions.md).

Create a new page component at `apps/web/src/pages/${input:pageName}Page.tsx`.

Use [CharactersPage.tsx](../../apps/web/src/pages/CharactersPage.tsx) as a reference for
structure and style.

## Requirements

1. Start with the SPDX header:

   ```tsx
   // SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
   // SPDX-License-Identifier: MIT
   ```

2. Use a named function export: `export function ${input:pageName}Page()`.
3. Use semantic HTML with a `<div className="mx-auto max-w-7xl px-4 py-12">` wrapper.
4. Include an `<h1>` heading as the first visible content.
5. Add the route to [App.tsx](../../apps/web/src/App.tsx) inside the
   `<Route element={<Layout />}>` group.
6. Import the page: `import { ${input:pageName}Page } from './pages/${input:pageName}Page';`.
7. Run `pnpm typecheck` to verify the new route compiles.
