---
description: Scaffold and integrate a new workspace package under `packages/`
argument-hint: '[name]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Add workspace package

Run the generator, then work the residual from
[`add-workspace-package.md`](../../docs/how-tos/add-workspace-package.md).

## Inputs

- Package name: **$1** (the `@genshin/<name>` short name)

## Requirements

1. Run `pnpm exec turbo gen package`. It writes the package, the Codecov flag,
   component, and upload steps, and the `apps/api/Dockerfile` COPY lines.
   Answer the tests and `apps/api` runtime dependency prompts from what the
   package is actually for; both gate injections that fail silently or
   opaquely when wrong.
2. Ask the user for the description and the human-readable name rather than
   inventing them.
3. The generator leaves `pnpm install`, wiring the package into its consuming
   packages, the `src/index.ts` stub, and the first test. Work those.
4. Run the how-to's Verify section before opening a pull request.
