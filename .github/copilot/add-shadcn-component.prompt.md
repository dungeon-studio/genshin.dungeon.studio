---
description: Add a new shadcn/ui component to `apps/web`
agent: agent
argument-hint: Component name (for example, accordion, tabs, or tooltip)
tools: ['editFiles', 'runInTerminal', 'codebase']
---

# Add shadcn/ui component

Follow the conventions in [code-generation.instructions.md](code-generation.instructions.md).

Use [button.tsx](../../apps/web/src/components/ui/button.tsx) and
[card.tsx](../../apps/web/src/components/ui/card.tsx) as references for the
expected style.

Install and configure a new `shadcn/ui` component.

## Steps

1. Run: `cd apps/web && pnpm dlx shadcn@3.8.5 add ${input:componentName}`
2. Verify the component was created at
   `apps/web/src/components/ui/${input:componentName}.tsx`.
3. Add the SPDX header to the generated file if missing:

   ```tsx
   // SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
   // SPDX-License-Identifier: MIT
   ```

4. Verify imports use `@/lib/utils` for `cn()` and ESM-compatible imports.
5. Ensure semantic HTML tags: `CardTitle` renders `<h3>`, `CardDescription`
   renders `<p>` (or equivalent for the component).
6. Run `pnpm --filter @genshin/web lint` to confirm no lint errors.
