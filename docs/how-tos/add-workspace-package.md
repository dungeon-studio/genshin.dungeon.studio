<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Add a workspace package

This guide covers the integration points touched when adding a new package
under `packages/` (or a tool under `tools/`). Several fail unhelpfully when
omitted. A forgotten CI matrix entry or Codecov flag leaves the package
uncovered with CI still green. A missing Dockerfile COPY fails the `apps/api`
image build on every PR.

Work top to bottom. Each section ends at a committable state.

---

## 1) Scaffold the package

Create `packages/<name>/` with these files. Copy `packages/validation/` as the
closest template.

- [ ] `package.json`:

  ```json
  {
    "name": "@genshin/<name>",
    "version": "0.0.0",
    "description": "...",
    "private": true,
    "type": "module",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": ["dist"],
    "scripts": {
      "typecheck": "tsc --noEmit",
      "build": "tsc --project tsconfig.build.json",
      "lint": "eslint .",
      "test": "vitest run"
    },
    "devDependencies": {
      "@genshin/eslint-config": "workspace:*",
      "@genshin/tsconfig": "workspace:*",
      "@typescript/native": "npm:typescript@7.0.2",
      "eslint": "10.4.0",
      "typescript": "npm:@typescript/typescript6@6.0.2"
    }
  }
  ```

  The `typecheck` and `build` scripts run `tsc` from `@typescript/native`. The
  `typescript` name resolves to the TypeScript 6 compatibility package, because
  `typescript-eslint` imports the compiler API through a `typescript` peer
  dependency and rejects TypeScript 7.

  Add `test` only once tests exist, along with the `vitest` and
  `@vitest/coverage-v8` dev dependencies and a `vitest.config.ts`.

- [ ] `tsconfig.json`: extends `@genshin/tsconfig/library.json` and adds only
      `outDir`, `rootDir`, `include`, and `exclude`. TypeScript resolves those
      four relative to the file declaring them, so the shared config can't carry
      them. A package reaching for Node APIs also adds `"types": ["node"]`.
- [ ] `tsconfig.build.json`: extends `./tsconfig.json` and adds
      `"exclude": ["src/**/*.test.ts"]`. The `build` script points here so test
      files stay out of `dist`.
- [ ] `eslint.config.js`: delegate to the shared config:

  ```js
  import genshinConfig from '@genshin/eslint-config';

  export default genshinConfig(import.meta.dirname);
  ```

- [ ] SPDX headers on every source file. For files without comment syntax,
      declare them in `.reuse/dep5`. See [Add SPDX headers](./add-spdx-headers.md).

## 2) Wire it into the workspace

- [ ] The `packages/*` glob in `pnpm-workspace.yaml` already covers a new
      `packages/<name>`. Only a new top-level directory needs a new glob.
- [ ] In each consuming package, add `"@genshin/<name>": "workspace:*"` under
      `dependencies`, not `devDependencies` (the Docker prune in step 4 drops
      `devDependencies`).
- [ ] Run `pnpm install` and commit the updated `pnpm-lock.yaml`.

## 3) Add it to continuous integration

- [ ] The `workspace` job in `.github/workflows/ci.yml` runs `typecheck`,
      `test`, and `build` across the whole workspace, so turbo picks up the new
      package from `pnpm-workspace.yaml`. No change to the job is required.

- [ ] Add an upload pair to `.github/actions/codecov-upload/action.yml` so the
      package reports under its own flag, and declare that flag in
      `codecov.yml` under `flag_management.individual_flags`. Copy an existing
      pair and change the paths and flag; one upload per flag is required, and
      the action explains why.

  Every entry runs the `typecheck`, `test`, and `build` tasks. Add the entry
  only once the package has a `test` script, or the `test` task fails.

- [ ] In `codecov.yml`, add both a flag and a component:

  ```yaml
  # under flag_management.individual_flags
  - name: <name>
    paths:
      - packages/<name>/src/**

  # under component_management.individual_components
  - component_id: <name>
    name: <Display Name>
    paths:
      - packages/<name>/src/**
    flag_regexes:
      - <name>
  ```

## 4) Update the Dockerfile (runtime dependency of a containerised app only)

`apps/api` is the only containerised app. Skip this section if the new package
is build- or test-only, or is consumed only by `apps/web`.

- [ ] In the builder stage of `apps/api/Dockerfile`, add the manifest copy
      alongside the other `packages/*/package.json` lines:

  ```dockerfile
  COPY packages/<name>/package.json ./packages/<name>/
  ```

- [ ] In the production stage, copy the built package:

  ```dockerfile
  COPY --from=builder /app/packages/<name> ./packages/<name>
  ```

- [ ] Confirm `.dockerignore` doesn't exclude the package. The `packages/`
      tree is copied wholesale, so no change is needed unless you add a top-level
      path.

## 5) Verify

- [ ] `pnpm turbo run typecheck`
- [ ] `pnpm turbo run test` (if the package has tests)
- [ ] `pnpm turbo run build`
- [ ] `pnpm reuse:check`
- [ ] `docker build -f apps/api/Dockerfile .` (if you touched the Dockerfile)
