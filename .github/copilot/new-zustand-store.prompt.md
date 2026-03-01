---
description: Create a new zustand store for UI state in `apps/web`
agent: agent
argument-hint: Store name in camelCase and its purpose
tools: ['editFiles', 'codebase', 'runInTerminal']
---

# New zustand store

Follow the conventions in [code-generation.instructions.md](code-generation.instructions.md).

Create a new zustand store for managing UI state.

## Inputs

- Store name: `${input:storeName}`
- Purpose: `${input:purpose}`

## Requirements

1. Create `apps/web/src/stores/${input:storeName}Store.ts` (camelCase file
   name per project convention).
2. Start with the SPDX header.
3. Define a clear interface for the store state and actions. Capitalize the
   store name for type names (for example, `teamFilter` → `TeamFilterState`):

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
6. Export the hook with a capitalized store name:
   `useTeamFilterStore` (not `useteamFilterStore`).
7. Don't put server or async state here—use TanStack Query for that.
8. Run `pnpm typecheck` to verify the store compiles.
