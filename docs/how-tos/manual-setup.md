<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Manual setup guide

This guide covers setting up the project **without DevContainers**.

**Recommended**: use VS Code + DevContainers instead. See [README.md](../../README.md#getting-started). It's faster and avoids manual configuration.

---

## Prerequisites

Make sure you have these installed:

```bash
node --version       # v20+ required
pnpm --version       # v9+ required
gh --version         # GitHub CLI
pre-commit --version # pre-commit hooks
jq --version         # JSON processor
```

### Install missing tools

#### macOS

```bash
# pnpm
npm install -g pnpm

# GitHub CLI
brew install gh

# pre-commit
brew install pre-commit

# jq
brew install jq
```

#### Linux / Windows Subsystem for Linux

```bash
# pnpm
npm install -g pnpm

# GitHub CLI - See https://cli.github.com/manual/installation for distro-specific instructions
# Debian/Ubuntu (including most WSL images)
sudo apt-get install gh

# Fedora
sudo dnf install gh

# pre-commit
pip install pre-commit

# jq (Debian/Ubuntu)
sudo apt-get install jq

# jq (Fedora)
sudo dnf install jq
```

---

## Quick setup

```bash
# Clone the repository
git clone https://github.com/dungeon-studio/genshin.dungeon.studio.git
cd genshin.dungeon.studio

# Install dependencies
pnpm install

# Set up pre-commit hooks (runs linters, formatters, SPDX checks automatically)
pre-commit install

# Start development servers
pnpm dev
```

The frontend is available at <http://localhost:5173>. The API is available at <http://localhost:8080>.

> **Note:** The API starts without Google Cloud credentials. Routes that don't
> use Firestore (health check, schemas) work immediately. Routes that read or
> write Firestore (profiles, teams, characters, weapons) return 500 until you
> configure credentials. See
> [Configure Firestore credentials](configure-firestore-credentials.md) for
> setup instructions.

---

## Verify your setup

Open your browser and visit <http://localhost:5173> to verify the frontend is running.

Check API health at <http://localhost:8080/health> to verify the API is running.

For more detailed development instructions, see [CONTRIBUTING.md](../../CONTRIBUTING.md).
