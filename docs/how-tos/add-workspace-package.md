<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Add a workspace package

This guide covers adding a new package under `packages/`. A generator writes
the package and the integration points that fail unhelpfully when omitted. A
forgotten Codecov flag leaves the package uncovered with CI still green. A
missing Dockerfile COPY fails the `apps/api` image build on every pull request.

Adding a tool under `tools/` follows the same shape, but the generator only
writes to `packages/`. Copy `tools/game-data-codegen/` and work sections 2
onward by hand.

---

## 1) Generate the package

```bash
pnpm exec turbo gen package
```

Two of its answers gate injections, so answer them from what the package is
actually for. Declaring tests adds `vitest.config.ts`, the Codecov flag and
component, and the upload steps. Declaring an `apps/api` runtime dependency
adds the `apps/api/Dockerfile` COPY lines.

When a file it injects into has changed shape, the generator stops and names
the file and the pattern that stopped matching. Delete `packages/<name>` before
re-running, or it refuses the name as taken.

The manifest's dev dependency versions come from `packages/validation/` as the
generator runs, so a new package starts on the same versions as its siblings.
Don't pin them by hand.

## 2) Wire it into the workspace

- [ ] Run `pnpm install` and commit the updated `pnpm-lock.yaml`.
- [ ] In each consuming package, add `"@genshin/<name>": "workspace:*"` under
      `dependencies`, not `devDependencies`. The Docker prune in the builder
      stage drops `devDependencies`.
- [ ] Replace the `export {}` stub in `src/index.ts`, giving every new source
      file an SPDX header. See [Add SPDX headers](./add-spdx-headers.md).
- [ ] Write the first test. `vitest run` exits non-zero on a package that has
      none.

Neither `pnpm-workspace.yaml` nor `.github/workflows/ci.yml` needs an edit. The
`packages/*` glob already covers the new directory, and the `workspace` job
runs the whole workspace through turbo.

## 3) Verify

- [ ] `pnpm turbo run typecheck`
- [ ] `pnpm turbo run test` (if the package has tests)
- [ ] `pnpm turbo run build`
- [ ] `pnpm reuse:check`
- [ ] `docker build -f apps/api/Dockerfile .` (if the package is an `apps/api`
      runtime dependency)
