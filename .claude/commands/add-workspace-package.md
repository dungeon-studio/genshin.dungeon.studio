---
description: Scaffold and integrate a new workspace package under `packages/`
argument-hint: '[name]'
allowed-tools: Read, Edit, Write, Bash, Grep, Glob
---

# Add workspace package

Work [`add-workspace-package.md`](../../docs/how-tos/add-workspace-package.md)
top to bottom for **$1**, the `@genshin/<name>` short name.

`turbo gen package` prompts for a description, a human-readable name, and two
answers that gate injections: whether the package has tests, and whether
`apps/api` depends on it at runtime. Ask the user for all four. Inventing them
produces a package wired for something it isn't.
