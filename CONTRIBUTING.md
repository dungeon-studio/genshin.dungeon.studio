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

### Building and running the Docker image

To build the API Docker image locally:

```bash
docker build -f apps/api/Dockerfile -t genshin-api:local .
```

To run it:

```bash
docker run -p 8080:8080 genshin-api:local
```

The API is available at `http://localhost:8080`. See [apps/api/Dockerfile](apps/api/Dockerfile) for build details and [.github/workflows/](.github/workflows/) for CI/CD pipeline information.

### Quality checks overview

Pre-commit enforces formatting, linting, documentation, secrets, and hygiene checks on every commit and on pull requests. If checks fail, fix the issues—see the Code quality section below for guidance.

### Quality gate ownership

- pre-commit.ci is the authoritative runner for hooks that it can run in its environment.
- [.github/workflows/pre-commit.yml](.github/workflows/pre-commit.yml) runs only hooks that can't run in pre-commit.ci.
- [.github/workflows/ci.yml](.github/workflows/ci.yml) runs build and type check jobs for apps and packages.
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
- Safety and repository hygiene checks for secrets, merge conflict markers, large files, trailing whitespace, line endings, and YAML/JSON validation

Pull requests must pass type checks in [ci.yml](.github/workflows/ci.yml). Run type checks locally before committing when your change affects TypeScript code:

```bash
pnpm typecheck
```

### Source file headers

All source files require SPDX headers per the [REUSE Specification](https://reuse.software/). Use `reuse addheader` or check [REUSE docs](https://reuse.software/tutorial/) for details.

### Code comments

For complex logic, decisions, or subtle patterns:

- Decisions and trade-offs—why you chose this approach
- Workarounds—temporary fixes with issue references
- Performance-sensitive code—explain the optimization
- External dependencies—integration quirks or API specifics

### Documentation strategy

When documenting decisions or conventions, prefer the highest-priority location that fits:

1. **Inline comments**: explain _why_ code works a certain way.
2. **Documentation strings**: explain module or function purpose when the name isn't sufficient.
3. **`docs/`**: task-specific how-tos, references, and explanations following the [Diátaxis](https://diataxis.fr/) framework.
4. **`CONTRIBUTING.md`**: high-level human workflow guidance and project conventions.
5. **`.github/copilot-instructions.md`**: AI-specific decision rules.

Avoid duplicating the same guidance across multiple locations. Place it once at the most appropriate level and link to it from others.

### Naming conventions

Use descriptive, specific names for files and modules. Avoid generic names like "helpers." For example, name a shared test auth module `auth-requests.ts`, not `helpers.ts`.

### Shared types

Branded types in `packages/domain/` each get their own file (for example, `uuid.ts`, `isoTimestamp.ts`). Export both the type and any related validation functions from the same file.

### Test utilities

Shared API test utilities live in `apps/api/src/test/` with descriptive file names. The build excludes this directory via `tsconfig.build.json`.

---

## Pull request workflow

### Branch flow for infrastructure

Infrastructure automation follows this branch strategy:

- `develop`: integration branch
- `release/*`: release-train branches cut from `develop`
- `main`: long-term release target branch, used when production flow is active

Current Terraform workflow routing:

- push to `develop`: applies `core` then `dev`
- push to `release/*`: applies `core` then `staging`
- pull requests to `develop`, `release/*`, and `main`: run Terraform plan checks

When creating release branches, derive the name from the root `package.json` version using SemVer2 context and always include both the release date and short hash token, for example:

- `release/0.1.0-20260221.d24af0f`

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

## Platform compatibility

This project runs on Windows, macOS, and Linux.

- Use Node.js `path` module for paths, not hardcoded `/` or `\`
- Use cross-platform packages like `rimraf` for file operations, not `rm -rf`
- Avoid OS-specific environment variables

### Detailed guides

For step-by-step instructions and technical details:

- [Manual Setup Guide](docs/how-tos/manual-setup.md): Development environment setup without DevContainers
- [Add Terraform Environment](docs/how-tos/add-terraform-environment.md): Bootstrap, scaffold, lock file, and workflow updates for new environments
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
