<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Turborepo cache invalidation patterns

Turborepo caches task outputs based on the `inputs` declared in `turbo.json`.
When inputs are too narrow, stale caches hide real failures. When inputs are too
broad, every change invalidates caches without reason. This document explains the
patterns this project follows to keep inputs precise.

---

## How Turborepo input matching works

Each task in `turbo.json` declares an `inputs` array of file globs. Turborepo
hashes the matching files to produce a cache key. If the hash matches a previous
run, Turborepo replays the cached output instead of re-executing the task.

`globalDependencies` apply to every task. This project declares environment
files and lock files there because changes to either can affect any package:

```json
"globalDependencies": ["**/.env*", "pnpm-lock.yaml", "pnpm-workspace.yaml"]
```

The `**/.env*` glob covers the full range of files that Vite and Node.js read:
`.env`, `.env.local`, `.env.development`, `.env.development.local`, and their
production equivalents. A narrower pattern like `**/.env.*.local` would miss
root-level `.env` files and break cache invalidation when they change.

---

## Match inputs to what tools actually read

The most common mistake is scoping inputs to `src/` when the tool reads files
outside that directory.

### Lint

ESLint runs on the entire project via `eslint .`, not just `src/`. Root-level
TypeScript files like `eslint.config.ts` and `vite.config.ts` are part of the
lint scope. The lint task uses `**/*.{ts,tsx}` to capture all TypeScript files,
not `src/**/*.{ts,tsx}`.

### Build

The build task depends on configuration files that live outside `src/`:

- `vite.config.*` controls bundling behavior
- `tsconfig*.json` controls TypeScript compilation
- `index.html` is the Vite entry point for web apps
- `public/**` contains static assets copied to the output

### Test

Tests that render components pull in CSS and other assets through import
statements. Using `src/**/*.{ts,tsx}` for test inputs misses these dependencies.
This project uses `src/**` to capture all files under `src/`, including assets.

### Type checking

TypeScript project references in `tsconfig.json` can include files outside
`src/`, such as `vite.config.ts` referenced by `tsconfig.node.json`. The
`typecheck` inputs include `vite.config.*` and `tsconfig*.json` so that changes
to these files invalidate the cache.

---

## Include `package.json` in every task

`package.json` affects tool behavior in ways that go beyond dependency versions.
The `type` field controls ESM versus CommonJS module resolution for ESLint,
TypeScript, and build tools. Changing it without invalidating caches produces
results from the wrong module mode. Every task in this project's `turbo.json`
includes `package.json` in its inputs.

---

## Avoid duplicate work in `dependsOn`

If a build script already runs `tsc -b`, adding `typecheck` to the task's
`dependsOn` runs TypeScript twice. This project centralizes TypeScript execution
through Turborepo tasks rather than embedding it in build scripts, so each
TypeScript invocation happens exactly once.

The `build`, `test`, and `typecheck` tasks each declare
`"dependsOn": ["^build"]` so that Turborepo builds workspace dependencies
before running the task. None of these tasks depend on each other, which avoids
redundant work.

---

## Guiding principle

When configuring inputs for a new task, run the tool manually and observe which
files it reads. Check configuration files for project references. It's better
to include a low-churn file than to miss a dependency that causes
stale cache hits.

---

## See also

- [`turbo.json`](../../turbo.json): the project's current Turborepo configuration
- [Turborepo caching documentation](https://turbo.build/repo/docs/crafting-your-repository/caching)
