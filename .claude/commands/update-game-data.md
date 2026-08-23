---
description: Add new game data (characters, weapons, artifacts) to `packages/game-data`
argument-hint: '[type] [version]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Update game data

Follow the conventions in
[`AGENTS.md`](../../AGENTS.md).

Add or update game data in `packages/game-data`. Characters and weapons are
generated from `genshin-db`; their how-tos below cover regeneration. For
hand-maintained data, use
[`artifacts.ts`](../../packages/game-data/src/artifacts.ts) as a reference for
data array structure and sort order.

## Inputs

- Data type: **$1** (characters, weapons, or artifacts)
- Version: **$2** (Genshin Impact version, for example, "5.4")

## Requirements

1. Follow the existing how-to guide for the data type:
   - Characters:
     [`update-game-characters.md`](../../docs/how-tos/update-game-characters.md)
   - Weapons: [`update-game-weapons.md`](../../docs/how-tos/update-game-weapons.md)
   - Artifacts:
     [`update-game-artifacts.md`](../../docs/how-tos/update-game-artifacts.md)
2. Maintain alphabetical sort order within the data arrays.
3. Use the existing type definitions; don't change type shapes without
   discussion.
4. Verify the data compiles with
   `pnpm turbo run build --filter=@genshin/game-data`.
5. Verify exports are accessible from
   [`index.ts`](../../packages/game-data/src/index.ts).
6. Run `pnpm turbo run typecheck` to catch cross-package type issues.
