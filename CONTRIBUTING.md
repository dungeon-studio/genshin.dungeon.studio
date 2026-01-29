# Contributing to Genshin Dungeon Studio

Thank you for your interest in contributing! This project is an AI-powered team building companion for Genshin Impact, and we welcome contributions of all kinds.

## Getting Started

Before contributing, please:

1. **Read the [Setup Guide](docs/SETUP_GUIDE.md)** for environment setup
2. **Check existing [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)** to see what's needed
3. **Run linters and formatters** before committing - they'll enforce code style automatically

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and constructive in all interactions.

---

## Daily Development Flow

### Starting Work

```bash
# 1. Ensure you're on develop
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Install any new dependencies
pnpm install

# 4. Start dev servers (from root)
pnpm dev
# Frontend: http://localhost:5173
# Backend: http://localhost:8080
```

---

## Feature Development Workflow

### 1. Create Feature Branch

```bash
# Naming convention: feature/description or fix/description
git checkout -b feature/character-collection
```

### 2. Develop with TDD

Write test first, then implement:

```typescript
// apps/web/src/features/collection/CharacterCard.test.tsx
describe('CharacterCard', () => {
  it('displays character name', () => {
    const character = { name: 'Hu Tao', element: 'Pyro' };
    render(<CharacterCard character={character} />);
    expect(screen.getByText('Hu Tao')).toBeInTheDocument();
  });
});
```

Then implement:

```typescript
// apps/web/src/features/collection/CharacterCard.tsx
export function CharacterCard({ character }) {
  return <div>{character.name}</div>;
}
```

Run tests:

```bash
pnpm test
```

### 3. Commit with Conventional Commits

```bash
git add .
git commit -m "feat(collection): add character card component

- Create CharacterCard component
- Add tests for character display
- Style with Tailwind CSS"
```

**Commit types:**

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code restructuring
- `style:` - Formatting, no code change
- `chore:` - Maintenance tasks

### 4. Push and Create PR

```bash
# Push branch
git push -u origin feature/character-collection

# Create PR via CLI
gh pr create --title "feat: Add character collection grid" \
  --body "Implements character collection view with:
  - CharacterCard component
  - Grid layout with Tailwind
  - Tests for rendering

  Closes #5"

# Or create PR in GitHub UI
```

### 5. Review and Merge

Once tests pass and code is reviewed:

```bash
# Merge via CLI
gh pr merge

# Or use GitHub UI merge button
```

### 6. Update Local

```bash
git checkout develop
git pull origin develop
git branch -d feature/character-collection
```

---

## Code Quality

### Before Committing

```bash
# Format code
pnpm format

# Type check
pnpm tsc --noEmit

# Run tests
pnpm test

# Lint (if configured)
pnpm lint
```

### Test Coverage

Aim for:

- **Critical paths**: 80%+ coverage
- **Utilities**: 90%+ coverage
- **UI components**: Test user interactions, not implementation details

---

## Need Help?

**For specific tasks:**

- [How to Add UI Components](docs/how-tos/add-ui-components.md)
- [How to Add API Endpoints](docs/how-tos/add-api-endpoints.md)
- [How to Add Shared Types](docs/how-tos/add-shared-types.md)
- [How to Run Tests](docs/how-tos/run-tests.md)
- [How to Debug Code](docs/how-tos/debugging.md)
- [How to Optimize Performance](docs/how-tos/optimize-performance.md)
- [Troubleshooting Common Issues](docs/how-tos/troubleshooting.md)

**For questions or issues:**

- Review [Troubleshooting Guide](docs/how-tos/troubleshooting.md)
- Open a [GitHub Discussion](https://github.com/dungeon-studio/genshin.dungeon.studio/discussions)
- Report bugs via [GitHub Issues](https://github.com/dungeon-studio/genshin.dungeon.studio/issues)

---

## Licensing

By contributing to this project, you agree that your contributions will be licensed under the [MIT License](LICENSE).

---

## Recognition

All contributors will be recognized in the project. Thank you for helping make this project better! 🎉
