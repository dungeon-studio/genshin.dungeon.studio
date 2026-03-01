---
description: Add new game data (characters, weapons, artifacts) to `packages/game-data`
agent: agent
argument-hint: Data type (characters, weapons, or artifacts) and game version
tools: ['editFiles', 'codebase', 'runInTerminal']
---

# Update game data

Follow the conventions in [code-generation.instructions.md](code-generation.instructions.md).

Add or update game data in `packages/game-data`.

Use [characters.ts](../../packages/game-data/src/characters.ts) as a reference
for data array structure and sort order.

## Inputs

- Data type: `${input:dataType}` (characters, weapons, or artifacts)
- Version: `${input:version}` (Genshin Impact version, for example, "5.4")

## Requirements

1. Follow the existing how-to guide for the data type:
   - Characters: [update-game-characters.md](../../docs/how-tos/update-game-characters.md)
   - Weapons: [update-game-weapons.md](../../docs/how-tos/update-game-weapons.md)
   - Artifacts: [update-game-artifacts.md](../../docs/how-tos/update-game-artifacts.md)
2. Maintain alphabetical sort order within the data arrays.
3. Use the existing type definitions—don't change type shapes without
   discussion.
4. Verify the data compiles: `pnpm --filter @genshin/game-data build`.
5. Verify exports are accessible from
   [index.ts](../../packages/game-data/src/index.ts).
6. Run `pnpm typecheck` to catch cross-package type issues.
