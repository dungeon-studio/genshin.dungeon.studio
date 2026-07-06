---
description: Scaffold and integrate a new workspace package under `packages/`
argument-hint: '[name]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Add workspace package

Work the how-to top to bottom:
[`add-workspace-package.md`](../../docs/how-tos/add-workspace-package.md). It's
the source of truth for every integration point (scaffolding, workspace wiring,
the CI matrix, the Codecov flag and component, and the `apps/api` Dockerfile
copies).

## Inputs

- Package name: **$1** (the `@genshin/<name>` short name)

## Requirements

1. Don't skip the Dockerfile section when the package is a runtime dependency
   of `apps/api`. A missed COPY fails the Docker build, not CI.
2. Copy `packages/validation/` as the closest scaffolding template.
3. Run the how-to's Verify section before opening a PR.
