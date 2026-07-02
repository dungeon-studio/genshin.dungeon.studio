---
description: Create a new zustand store for UI state in `apps/web`
argument-hint: '[name] [purpose]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# New zustand store

Follow the conventions in
[`code-generation.instructions.md`](../../.github/copilot/code-generation.instructions.md).

Create a new zustand store for managing UI state. Keep zustand for UI state
only; server and async state belongs in TanStack Query.

## Inputs

- Store name (camelCase): **$1**
- Purpose: **$2**

## Requirements

1. Create `apps/web/src/stores/<name>-store.ts` with a kebab-case file name
   (for example, `teamFilter` becomes `team-filter-store.ts`). The `stores/`
   directory doesn't exist yet, so create it.
2. Start with the SPDX header.
3. Define clear interfaces for state and actions. Capitalize the store name for
   type names (for example, `teamFilter` becomes `TeamFilterState` and
   `TeamFilterActions`):

   ```ts
   interface TeamFilterState {
     // state fields
   }

   interface TeamFilterActions {
     // action methods
   }
   ```

4. Use `create<State & Actions>()` from zustand.
5. Keep the store focused on a single concern.
6. Export the hook with a capitalized store name, for example
   `useTeamFilterStore`.
7. Keep server and async state out of the store; use TanStack Query for that.
8. Run `pnpm turbo run typecheck` to verify the store compiles.
