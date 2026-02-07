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
node --version    # v20+ required
pnpm --version    # v9+ required
gh --version      # GitHub CLI
```

### Install missing tools

```bash
# pnpm
npm install -g pnpm

# GitHub CLI - See https://cli.github.com/manual/installation
# Installation instructions vary by OS
```

---

## Quick setup

```bash
# Clone the repository
git clone https://github.com/dungeon-studio/genshin.dungeon.studio.git
cd genshin.dungeon.studio

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

The frontend is available at <http://localhost:5173>. The API service is available at <http://localhost:8080> once it exists.

---

## Verify your setup

Open your browser and visit <http://localhost:5173> to verify the frontend is running.

You can check API health once the API service exists.

For more detailed development instructions, see [CONTRIBUTING.md](../../CONTRIBUTING.md).
