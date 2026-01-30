# Contributing to Genshin Dungeon Studio

Thank you for your interest in contributing! This project is an AI-powered team building companion for Genshin Impact, and we welcome contributions of all kinds.

## Getting Started

### Quickest Path (Recommended)

1. Open the repository in VS Code
2. Click **"Reopen in Container"** when prompted (DevContainers extension required)
3. Wait for container setup (~2-3 minutes on first run)
4. ✅ You're ready to develop!

### Alternative: Manual Setup

If not using DevContainers, see [Manual Setup Guide](docs/how-tos/manual-setup.md).

### Before Contributing

- **Check existing [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)** to see what's needed
- **Run linters and formatters** before committing - they'll enforce code style automatically

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

---

## Development Workflow Overview

Our contribution process follows these principles:

1. **Check Issues First** — Browse [existing issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues) to see what needs work
2. **Create a Feature Branch** — Use naming convention: `feature/description` or `fix/description`
3. **Develop with TDD** — Write tests alongside (or before) implementation
4. **Commit with Conventional Commits** — Follow the standard format
5. **Open a PR** — Reference the issue it addresses
6. **Iterate** — Address review feedback, tests pass, merge when ready

### Quick Start Commands

Once your environment is set up:

```bash
# Ensure you're on develop and pull latest
git checkout develop
git pull origin develop

# Install dependencies
pnpm install

# Start dev servers
pnpm dev
```

### Code Quality Standards

Before committing:

```bash
pnpm format     # Format code with Prettier
pnpm typecheck  # Type check using TypeScript build mode
pnpm test       # Run tests
pnpm lint       # Check for linting issues
```

**Test coverage targets:**

- Critical paths: 80%+
- Utilities: 90%+
- UI components: Focus on user interactions, not implementation details

**Commit types** (use these prefixes in your commit messages):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `test:` — Adding/updating tests
- `refactor:` — Code restructuring
- `style:` — Formatting
- `chore:` — Maintenance

### Project Consistency

**When updating project descriptions**, ensure consistency across:

- [package.json](package.json) — `"description"` field
- [README.md](README.md) — One-line tagline
- GitHub repository description (maintainers only; update via repo settings)

### Detailed Guides

For step-by-step instructions and technical details:

- [Manual Setup Guide](docs/how-tos/manual-setup.md) — Development environment setup without DevContainers
- [Troubleshooting Guide](docs/how-tos/troubleshooting.md) — Solutions for common issues

---

## Need Help?

**For questions or issues:**

- Review [Troubleshooting Guide](docs/how-tos/troubleshooting.md) for common problems
- Open a [GitHub Discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/discussions) for questions
- Report bugs via [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)

---

## Licensing

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## Recognition

All contributors will be recognized in the project. Thank you for helping make this project better! 🎉
