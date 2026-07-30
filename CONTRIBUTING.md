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

### Quality checks overview

Pre-commit enforces formatting, linting, documentation, and hygiene checks on every commit and on pull requests. If checks fail, fix the issues—see [Code quality](#code-quality) for the tools involved.

### Quality gate ownership

- [.github/workflows/ci.yml](.github/workflows/ci.yml) runs everything that gates a pull request: the workspace build and tests, every pre-commit hook, and the security scans. Each is its own job, so a failure names the check. A hook added to `.pre-commit-config.yaml` is enforced there without any workflow edit.
- [.github/workflows/weekly.yml](.github/workflows/weekly.yml) checks external URLs and reports breakage via a GitHub issue rather than blocking, since transient outages make per-PR external checks flaky.
- Feature work adds tests and enforces them when it introduces testable behavior.

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

Pre-commit hooks automatically enforce key checks, including:

- **Prettier** - Code formatting
- **ESLint** - JavaScript/TypeScript linting with automatic fixes when possible
- CSS linting with Tailwind directives
- Documentation and config linting for Markdown, YAML, and prose
- Safety and repository hygiene checks for merge conflict markers, large files, trailing whitespace, line endings, and YAML/JSON validation
- Exact dependency versions via [syncpack](https://jamiemason.github.io/syncpack/): `package.json` dependencies stay pinned with no `^` or `~` ranges. Run `pnpm exec syncpack fix` to pin offenders
- SPDX license headers via [REUSE](https://reuse.software/): every source file needs one—see [Add SPDX headers](docs/how-tos/add-spdx-headers.md)

Pull requests must pass type checks in [ci.yml](.github/workflows/ci.yml). Run type checks locally before committing when your change affects TypeScript code:

```bash
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

### Addressing review comments

1. Address feedback completely
2. Batch related fixes when possible
3. Pre-commit hooks verify formatting and linting. For type checking, run:

   ```bash
   pnpm typecheck
   ```

---

## Changelog

[CHANGELOG.md](CHANGELOG.md) is hand-curated and follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). It's a separate artifact from the GitHub Release notes that [Release Drafter](.github/release-drafter.yml) aggregates from merged pull requests: the release notes stay pull-request-centric for GitHub readers, while the changelog stays curated for humans.

When your pull request changes something a user of the deployed app would notice—a new or removed feature, a change to existing behavior, a user-facing bug fix, or a security fix—add a line under `### Added` in the `[Unreleased]` section. Skip internal refactors, test-only changes, dependency bumps users don't perceive, and documentation fixes. The test is whether a user would notice or care. The [CHANGELOG.md](CHANGELOG.md) header describes the entry layout before and after the first release.

---

## Detailed guides

For step-by-step instructions and technical details:

- [Manual Setup Guide](docs/how-tos/manual-setup.md): Development environment setup without DevContainers
- [Build the API Docker image](docs/how-tos/build-api-docker-image.md): Build and run the `apps/api` container locally
- [Add Terraform Environment](docs/how-tos/add-terraform-environment.md): Bootstrap, scaffold, lock file, and workflow updates for new environments
- [Infrastructure branch flow](docs/reference/infrastructure-branch-flow.md): How branches map to environments and Terraform actions
- [Code conventions](docs/reference/code-conventions.md): Naming, shared types, test utilities, documentation strategy, and platform compatibility
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
