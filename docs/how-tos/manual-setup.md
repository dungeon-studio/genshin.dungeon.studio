<!--
SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
SPDX-License-Identifier: MIT
-->

# Manual setup guide

This guide covers setting up the project **without DevContainers**.

**Recommended**: use VS Code + DevContainers instead. See [README.md](../../README.md#getting-started). It's faster and avoids manual configuration.

---

## Prerequisites

The setup script installs most tooling automatically. You only need these
on your host before running it:

- **Node.js** v20+ (`node --version`)
- **Java** 21+, required by Firebase emulators (`java -version`)
- **Firebase CLI** (`firebase --version`)
- **GitHub CLI** (`gh --version`)
- **pre-commit** (`pre-commit --version`)
- **jq** (`jq --version`)
- **pipx** (`pipx --version`)

### Install missing prerequisites

#### macOS

```bash
brew install openjdk@21 gh jq pipx pre-commit
npm install -g firebase-tools
```

#### Linux / Windows Subsystem for Linux

```bash
# Debian/Ubuntu (including most WSL images)
sudo apt-get install openjdk-21-jre-headless gh jq pipx
pipx install pre-commit
npm install -g firebase-tools

# Fedora
sudo dnf install java-21-openjdk-headless gh jq pipx
pipx install pre-commit
npm install -g firebase-tools
```

---

## Quick setup

```bash
# Clone the repository
git clone https://github.com/dungeon-studio/genshin.dungeon.studio.git
cd genshin.dungeon.studio

# Run the setup script (installs dependencies, hooks, and verifies tools)
# NOTE: The script assumes Debian/Ubuntu for the Google Cloud SDK install step.
# On macOS or Fedora, install gcloud separately and run the remaining steps manually.
.devcontainer/postCreateCommand.sh

# Configure the web app for local emulators
cp apps/web/.env.example apps/web/.env.local
```

The script prints a verification summary at the end. If any tools fail
verification, fix them and re-run the script.

Edit `apps/web/.env.local` and fill in the Firebase client config. For local
emulator development, any non-empty placeholder values work because the emulator
doesn't validate them. See `apps/web/.env.example` for the full list.

```bash
# Start development servers
pnpm dev
```

The frontend is available at <http://localhost:5173>. The API is available at <http://localhost:8080>.

Firebase Auth and Firestore emulators start automatically with `pnpm dev`, so
all routes work immediately. To use real GCP Firestore instead, see
[Configure Firestore credentials](configure-firestore-credentials.md).

---

## Re-verify your environment

Run the attach script any time to re-check all tools without reinstalling:

```bash
.devcontainer/postAttachCommand.sh
```

For more detailed development instructions, see [CONTRIBUTING.md](../../CONTRIBUTING.md).
