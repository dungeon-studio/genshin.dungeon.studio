<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Contributing to genshin.dungeon.studio

Thank you for your interest in contributing. This project is an AI-powered team building companion for Genshin Impact, and contributions of all kinds are welcome.

## Getting started

### Recommended quickest path

1. Open the repository in VS Code
2. Click **"Reopen in Container"** when prompted. DevContainers extension required.
3. Wait for container setup, about 2 to 3 minutes on first run
4. ✅ You're ready to develop.

### Alternative: Manual setup

If not using DevContainers, see [Manual Setup Guide](docs/how-tos/manual-setup.md).

### Before contributing

- **Check existing [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)** to see what's needed
- **Run linters and formatters** before committing - they'll enforce code style automatically

## Code of conduct

This project commits to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

---

## Development workflow overview

The contribution process follows these principles:

1. **Check Issues First**: Browse [existing issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues) to see what needs work
2. **Create a Feature Branch**: Use naming convention: `feature/description` or `fix/description`
3. **Develop with test-driven development**: Write tests alongside or before implementation.
4. **Commit with Conventional Commits**: Follow the standard format
5. **Open a PR**: Reference the issue it addresses
6. **Iterate**: Address review feedback, tests pass, merge when ready

### Quick start commands

Once you set up your environment:

```bash
# Ensure you're on develop and pull latest
git checkout develop
git pull origin develop

# Install dependencies
pnpm install

# Start dev servers
pnpm dev
```

> **Note:** The API starts without Google Cloud credentials. Routes that don't
> use Firestore (health check, schemas) work immediately. Routes that read or
> write Firestore (profiles, teams, characters, weapons) return 500 until you
> configure credentials. See
> [Configure Firestore credentials](docs/how-tos/configure-firestore-credentials.md)
> for setup instructions.

After a `pnpm-lock.yaml` change, whether yours or one you pulled, run
`pnpm install` and restart any dev server you already have running. Vite reads
module resolution once at startup, so a running server reports
`Cannot find module` for the new dependency until you restart it.

### What your pull request has to pass

- Every pre-commit hook. Run `pre-commit install` once, and the same hooks run on each commit that CI runs over the whole tree—so a clean commit is a clean build. The first commit afterward builds each hook's environment and can take several minutes. `pre-commit run --all-files` reproduces CI exactly.
- The workspace build and tests: `pnpm turbo run typecheck test build`.
- The end-to-end suite in `tools/e2e`: `pnpm turbo run test:e2e`. It starts the Firebase emulators, the API, and the dev server itself, so stop any `pnpm dev` first—in this checkout or any other worktree—or the emulators fail to bind.
- Feature work adds tests when it introduces testable behavior.

Broken external URLs are the one exception: a weekly run files them as a GitHub issue rather than blocking a pull request, since transient outages would make that check flaky. For which workflow runs what, see [workflow conventions](docs/reference/workflow-conventions.md).

**Commit types**. Use these prefixes in your commit messages:

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation
- `test:` adding or updating tests
- `refactor:` code restructuring
- `style:` formatting
- `chore:` maintenance

### Project consistency

**When updating project descriptions**, make sure these stay consistent:

- [package.json](package.json): `"description"` field
- [README.md](README.md): One-line tagline
- GitHub repository description. Maintainers update this via repo settings.

---

## Code quality

[`.pre-commit-config.yaml`](.pre-commit-config.yaml) is the source of truth for which checks run. Two of them enforce project rules:

- `package.json` dependencies stay pinned exactly, with no `^` or `~` ranges. Run `pnpm exec syncpack fix` to pin offenders.
- Every source file carries an SPDX license header—see [Add SPDX headers](docs/how-tos/add-spdx-headers.md).

Every commit lints and type checks the whole workspace, and [ci.yml](.github/workflows/ci.yml) checks both again. Turborepo caches them, so an unchanged check replays instead of rerunning. The lint hook reports without rewriting, so `pnpm lint -- --fix` is what applies the fixes it can make. To see either result without committing:

```bash
pnpm lint
pnpm typecheck
```

For code conventions—comments, documentation strategy, naming, shared types, test utilities, and platform compatibility—see [Code conventions](docs/reference/code-conventions.md).

---

## Testing

- **Test behavior, not values**: assert what code does, not what a constant equals.
- **Don't test what a library should encapsulate**: library behavior, language semantics, and configuration values are already tested by their authors.
- **Don't assert what's true by definition**: a test that can't fail when the code under test is wrong proves nothing; if deleting the implementation wouldn't break it, rewrite or delete it.
- **Assert only the necessary properties**: keep each assertion as close to the property under test as possible; redundant assertions obscure what the test proves.
- **Use `satisfies` for fixture annotations**: it validates the fixture shape at the declaration site without changing the inferred type, avoiding index-signature assignability errors.
- **One schema assertion per route test, then field-level spot checks**: validate the response against the published JSON Schema with AJV first, then assert one specific value; don't re-test the schema field by field.
- **Reserve the emulator suite for what no route can produce**: an `*.integration.test.ts` earns its place when it has to plant a stored document the API itself would never write, not by re-covering ground the route or browser suites already reach.

---

## Pull request workflow

### Branch naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `chore/description` - Maintenance
- `docs/description` - Documentation

### Before merging

- ✅ No linting errors
- ✅ TypeScript compiles without errors
- ✅ Code formatted with Prettier
- ✅ Pull request description is accurate

### Merge strategy

- **Squash and merge** - All pull request commits become one commit on develop
- The pull request title becomes the final commit message. Use conventional commit format.
- Keep commit history clean - one feature equals one commit

### Commit messages

The pull request title becomes the commit message, so it carries these rules:

- Format: `type(scope): subject`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- Write the subject in imperative mood ("add character filter," not "added" or "adds"), lowercase, under 50 characters, and with no trailing period

Scope is the workspace package the change is confined to: `feat(web)` for `apps/web`, `fix(api)` for `apps/api`, `refactor(game-data)` for `packages/game-data`, `chore(domain)` for `packages/domain`, and `chore(infra)` for Terraform and infrastructure. Omit the scope for changes that span packages, including most `docs:` changes.

When a commit needs a body, separate it from the subject with a blank line, wrap it at 72 characters, and use it to explain what changed and why rather than how.

### Addressing review comments

1. Address feedback completely
2. Batch related fixes when possible

---

## Changelog

[CHANGELOG.md](CHANGELOG.md) is hand-curated and follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). It's a separate artifact from the GitHub Release notes that [Release Drafter](.github/release-drafter.yml) aggregates from merged pull requests: the release notes stay pull-request-centric for GitHub readers, while the changelog stays curated for humans.

When your pull request changes something a user of the deployed app would notice—a new or removed feature, a change to existing behavior, a user-facing bug fix, or a security fix—add a line under `### Added` in the `[Unreleased]` section, one bullet per change. Skip internal refactors, test-only changes, dependency bumps users don't perceive, and documentation fixes. The test is whether a user would notice or care. The [CHANGELOG.md](CHANGELOG.md) header describes the entry layout before and after the first release.

Name a technology—"zustand store," "TanStack Query"—only when the user interacts with that technology directly.

---

## Detailed guides

For step-by-step instructions and technical details:

- [Manual Setup Guide](docs/how-tos/manual-setup.md): Development environment setup without DevContainers
- [Build the API Docker image](docs/how-tos/build-api-docker-image.md): Build and run the `apps/api` container locally
- [Add Terraform Environment](docs/how-tos/add-terraform-environment.md): Bootstrap, scaffold, lock file, and workflow updates for new environments
- [Infrastructure branch flow](docs/reference/infrastructure-branch-flow.md): How branches map to environments and Terraform actions
- [Code conventions](docs/reference/code-conventions.md): Naming, shared types, test utilities, documentation strategy, and platform compatibility
- [Workflow conventions](docs/reference/workflow-conventions.md): How workflows and jobs are named, which branches get push runs, and how tool versions are pinned
- [REST API conventions](docs/reference/rest-api-conventions.md): Route design, method semantics, status codes, error shape, and pagination

---

## Need help

**For questions or issues:**

- Review [Manual Setup Guide](docs/how-tos/manual-setup.md) for environment setup help
- Open a [GitHub Discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/discussions) for questions
- Report bugs via [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)

---

## Licensing

<!-- vale Google.Parens = NO -->

By contributing to this project, you agree to license your contributions under the [Massachusetts Institute of Technology (MIT) License](LICENSE).

<!-- vale Google.Parens = YES -->
