<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Contributing to genshin.dungeon.studio

Thank you for your interest in contributing. This project is a team building companion for Genshin Impact, and contributions of all kinds are welcome.

## Getting started

### Recommended quickest path

1. Open the repository in VS Code
2. Click **"Reopen in Container"** when prompted. DevContainers extension required.
3. Wait for container setup, about 2 to 3 minutes on first run
4. ✅ You're ready to develop.

### Manual setup

If not using DevContainers, see [Manual Setup Guide](docs/how-tos/manual-setup.md).

## Code of conduct

This project commits to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

---

## Development workflow overview

1. Pick up an [existing issue](https://github.com/dungeon-studio/genshin.dungeon.studio/issues), or open one before starting larger work.
2. Write tests alongside or before the implementation.
3. Open a pull request into `develop` whose description references the issue and whose title follows the [commit message rules](#commit-messages).
4. Keep the description accurate as review changes the work.

### Quick start commands

Once you set up your environment:

```bash
# Ensure you're on develop and pull latest
git checkout develop
git pull origin develop

# Install dependencies
pnpm install

# Start dev servers and the Firebase emulators
pnpm dev
```

After a `pnpm-lock.yaml` change, restart any dev server that's already running.
Vite reads module resolution once at startup, so a server left running reports
`Cannot find module` for the new dependency.

### What your pull request has to pass

[ci.yml](.github/workflows/ci.yml) runs every pre-commit hook plus the workspace, integration, and end-to-end suites. To reproduce it locally:

- Run `pre-commit install` once so each commit runs the hooks CI runs over the whole tree. The first commit afterward builds each hook's environment and can take several minutes. `pre-commit run --all-files` matches the CI run.
- `pnpm turbo run typecheck test build verify` runs the workspace suite.
- `pnpm turbo run test:integration` and `pnpm turbo run test:e2e` each start the Firebase emulators themselves. Stop any `pnpm dev` first, in this checkout or any other worktree, or the emulators fail to bind.
- Feature work adds tests when it introduces testable behavior.

Broken external URLs don't block a pull request. A weekly run files them as a GitHub issue instead. For which workflow runs what, see [workflow conventions](docs/reference/workflow-conventions.md).

### Project consistency

**When updating project descriptions**, make sure these stay consistent:

- [package.json](package.json): `"description"` field
- [README.md](README.md): one-line tagline
- GitHub repository description. Maintainers update this via repo settings.

---

## Code quality

[`.pre-commit-config.yaml`](.pre-commit-config.yaml) is the source of truth for which checks run. Two of them enforce project rules:

- `package.json` dependencies stay pinned exactly, with no `^` or `~` ranges. Run `pnpm exec syncpack fix` to pin offenders.
- Every source file carries an SPDX license header. See [Add SPDX headers](docs/how-tos/add-spdx-headers.md).

The lint hook reports without rewriting, so run `pnpm lint -- --fix` to apply the fixes it can make.

For code conventions—comments, documentation strategy, naming, shared types, test utilities, and platform compatibility—see [Code conventions](docs/reference/code-conventions.md).

---

## Testing

- **Test behavior, not values**: assert what code does, not what a constant equals.
- **Don't test what a library should encapsulate**: library behavior, language semantics, and configuration values are already tested by their authors.
- **Don't assert what's true by definition**: a test that can't fail when the code under test is wrong proves nothing. Rewrite or delete any test that still passes after you delete the implementation.
- **Assert only the necessary properties**: keep each assertion as close to the property under test as possible. Redundant assertions obscure what the test proves.
- **Use `satisfies` for fixture annotations**: it validates the fixture shape at the declaration site without changing the inferred type, avoiding index-signature assignability errors.
- **One schema assertion per route test, then field-level spot checks**: validate the response with AJV using the published JSON Schema, then assert one specific value. Don't re-test the schema field by field.
- **Reserve the emulator suite for what no route can produce**: an `*.integration.test.ts` earns its place by planting a stored document the API itself would never write. Re-covering what the route or browser suites already reach doesn't earn one.

---

## Commit messages

Pull requests squash-merge, so the pull request title becomes the commit on `develop` and carries these rules:

- Format: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Write the subject in imperative mood, lowercase, under 50 characters, and with no trailing period: `add character filter`, not `added` or `adds`

Scope names the one workspace package the change touches: `feat(web)` for `apps/web`, `fix(api)` for `apps/api`, `refactor(game-data)` for `packages/game-data`, `chore(domain)` for `packages/domain`, and `chore(infra)` for Terraform and infrastructure. Omit the scope for changes that span packages, including most `docs:` changes.

Separate a commit body from the subject with a blank line and wrap it at 72 characters. Use it to explain what changed and why rather than how.

---

## Changelog

[CHANGELOG.md](CHANGELOG.md) is hand-curated and follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). GitHub Release notes are separate and build themselves from merged pull requests.

Add a changelog line for any change a user of the deployed app would notice. That covers a new or removed feature, a change to existing behavior, a user-facing bug fix, or a security fix. Put it under `### Added` in the `[Unreleased]` section, one bullet per change. Skip internal refactors, test-only changes, dependency bumps users don't perceive, and documentation fixes. The test is whether a user would notice or care. The [CHANGELOG.md](CHANGELOG.md) header describes the entry layout before and after the first release.

Name a technology—"zustand store," "TanStack Query"—only when the user interacts with that technology directly.

---

## Detailed guides

For step-by-step instructions and technical details:

- [Manual Setup Guide](docs/how-tos/manual-setup.md): development environment setup without DevContainers
- [Configure Firestore credentials](docs/how-tos/configure-firestore-credentials.md): point the API at a real GCP project instead of the emulators
- [Build the API Docker image](docs/how-tos/build-api-docker-image.md): build and run the `apps/api` container locally
- [Add Terraform Environment](docs/how-tos/add-terraform-environment.md): bootstrap, scaffold, lock file, and workflow updates for new environments
- [Infrastructure branch flow](docs/reference/infrastructure-branch-flow.md): how branches map to environments and Terraform actions
- [Code conventions](docs/reference/code-conventions.md): naming, shared types, test utilities, documentation strategy, and platform compatibility
- [Workflow conventions](docs/reference/workflow-conventions.md): how to name workflows and jobs, which branches get push runs, and how to pin tool versions
- [REST API conventions](docs/reference/rest-api-conventions.md): route design, method semantics, status codes, error shape, and pagination

---

## Need help

- Open a [GitHub Discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/discussions) for questions
- Report bugs via [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)

---

## Licensing

<!-- vale Google.Parens = NO -->

By contributing to this project, you agree to license your contributions under the [Massachusetts Institute of Technology (MIT) License](LICENSE).

<!-- vale Google.Parens = YES -->
