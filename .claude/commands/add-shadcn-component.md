---
description: Add a new shadcn/ui component to `apps/web`
argument-hint: '[component]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Add shadcn/ui component

Follow the conventions in
[`code-generation.instructions.md`](../../.github/copilot/code-generation.instructions.md).

Use [`button.tsx`](../../apps/web/src/components/ui/button.tsx) and
[`card.tsx`](../../apps/web/src/components/ui/card.tsx) as references for the
expected style.

Install and configure a new `shadcn/ui` component.

## Inputs

- Component name: **$1**

## Steps

1. Run `cd apps/web && pnpm dlx shadcn@3.8.5 add $1`.
2. Verify the component was created at `apps/web/src/components/ui/$1.tsx`.
3. Add the SPDX header to the generated file if missing:

   ```tsx
   // SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
   // SPDX-License-Identifier: MIT
   ```

4. Verify imports use `@/lib/utils` for `cn()` and ESM-compatible imports.
5. Ensure semantic HTML tags: `CardTitle` renders `<h3>` and `CardDescription`
   renders `<p>` (or the equivalent for the component).
6. Run `pnpm turbo run lint --filter=@genshin/web` to confirm no lint errors.
