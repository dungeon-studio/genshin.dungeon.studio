# Manual Setup Guide

This guide covers setting up the project **without DevContainers**.

**Recommended**: Use VS Code + DevContainers instead (see [README.md](../../README.md#getting-started)) - it's faster and avoids manual configuration.

---

## Prerequisites

Ensure you have these installed:

```bash
node --version    # v20+ required
pnpm --version    # v9+ required
gh --version      # GitHub CLI
```

### Install Missing Tools

```bash
# pnpm
npm install -g pnpm

# GitHub CLI (Linux)
sudo apt install gh
```

---

## Quick Setup

```bash
# Clone the repository
git clone https://github.com/dungeon-studio/genshin.dungeon.studio.git
cd genshin.dungeon.studio

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

The frontend will be available at http://localhost:5173
The backend will be available at http://localhost:8080

---

## Verify Your Setup

```bash
# Check that everything is running
curl http://localhost:5173  # Frontend
curl http://localhost:8080  # Backend API

# Run tests
pnpm test
```

For more detailed development instructions, see [CONTRIBUTING.md](../../CONTRIBUTING.md).

---

## Troubleshooting

See [Troubleshooting Guide](./troubleshooting.md) for common issues.
