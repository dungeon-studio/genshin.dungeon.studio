# Contributing to Genshin Dungeon Studio

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

### Code quality standards

Before committing:

```bash
pnpm format     # Format code with Prettier
pnpm typecheck  # Type check using TypeScript build mode
pnpm test       # Run tests
pnpm lint       # Check for linting issues
```

**Documentation checks**:

- If pre-commit reports Vale issues, run Vale manually after fixing errors to catch warnings and suggestions
- Use line-level Vale suppression comments for known false positives, such as license badges

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

### Detailed guides

For step-by-step instructions and technical details:

- [Manual Setup Guide](docs/how-tos/manual-setup.md): Development environment setup without DevContainers

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
