<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Add a workspace package

This guide covers adding a new package under `packages/`. A generator writes
the package and the integration points that fail unhelpfully when omitted: a
forgotten Codecov flag leaves the package uncovered with CI still green, and a
missing Dockerfile COPY fails the `apps/api` image build on every pull request.
What remains needs a judgement the generator can't make.

Adding a tool under `tools/` follows the same shape, but the generator only
writes to `packages/`. Copy `tools/game-data-codegen/` and work sections 2
onward by hand.

---

## 1) Generate the package

```bash
pnpm exec turbo gen package
```

It prompts for the package name, a human-readable name, a description, whether
the package has tests, and whether `apps/api` depends on it at runtime. Answer
the last two accurately: the first adds the `vitest.config.ts`, the Codecov
flag, the Codecov component, and the upload steps; the second adds the
`apps/api/Dockerfile` COPY lines.

The generator refuses to guess when a file it injects into has changed shape,
and names the file and the pattern that stopped matching. Delete
`packages/<name>` before re-running, or the generator refuses the name as
taken.

`packages/validation/` is the template. The generated manifest takes its dev
dependency versions from that package at run time, so a new package starts on
whatever Renovate and syncpack currently hold.

## 2) Wire it into the workspace

- [ ] Run `pnpm install` and commit the updated `pnpm-lock.yaml`.
- [ ] In each consuming package, add `"@genshin/<name>": "workspace:*"` under
      `dependencies`, not `devDependencies`. The Docker prune in the builder
      stage drops `devDependencies`.
- [ ] Replace the `export {}` stub in `src/index.ts`. Every source file needs
      SPDX headers; for files without comment syntax, declare them in
      `REUSE.toml`. See [Add SPDX headers](./add-spdx-headers.md).
- [ ] Write the first test. `vitest run` exits non-zero on a package that has
      none, so a package generated with tests stays red until one exists.

The `packages/*` glob in `pnpm-workspace.yaml` already covers the new
directory, and the `workspace` job in `.github/workflows/ci.yml` runs the whole
workspace through turbo, so neither needs an edit.

## 3) Verify

- [ ] `pnpm turbo run typecheck`
- [ ] `pnpm turbo run test` (if the package has tests)
- [ ] `pnpm turbo run build`
- [ ] `pnpm reuse:check`
- [ ] `docker build -f apps/api/Dockerfile .` (if the package is an `apps/api`
      runtime dependency)
