# How to Run Tests

This guide shows you the different ways to run tests in the project.

## Prerequisites

- Dependencies are installed (`pnpm install`)
- Test files exist (`.test.ts` or `.test.tsx`)

## All Tests

Run all tests across the monorepo:

```bash
pnpm test
```

## Watch Mode

Run tests in watch mode (re-runs on file changes):

```bash
pnpm test --watch
```

## With UI

Run tests with Vitest's UI:

```bash
pnpm test:ui
```

## Specific App

Run tests for a specific application:

```bash
# Frontend tests only
cd apps/web && pnpm test

# Backend tests only
cd apps/api && pnpm test
```

## Single Test File

Run a specific test file:

```bash
pnpm test CharacterCard.test.tsx

# Or with full path
pnpm test apps/web/src/features/collection/CharacterCard.test.tsx
```

## Coverage Report

Generate test coverage report:

```bash
pnpm test --coverage
```

## Tips

- Use `describe` blocks to group related tests
- Use descriptive test names: `it('displays character name')`
- Run tests before committing code
- Aim for meaningful tests, not just coverage numbers
