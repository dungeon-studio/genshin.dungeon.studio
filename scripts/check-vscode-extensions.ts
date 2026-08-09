// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

// Asserts that the VS Code extension recommendations in .vscode/extensions.json
// stay in lockstep with the extensions .devcontainer/devcontainer.json installs.
// Both files carry a MAINTENANCE comment pointing at the other; this enforces it.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface ExtensionsJson {
  recommendations?: string[];
}

interface DevContainerJson {
  customizations?: {
    vscode?: {
      extensions?: string[];
    };
  };
}

function stripJsonc(content: string): string {
  return content
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/,(\s*[}\]])/g, '$1');
}

function readJsonc<T>(path: string): T {
  return JSON.parse(stripJsonc(readFileSync(path, 'utf-8'))) as T;
}

const root = process.cwd();
const extensionsPath = join(root, '.vscode', 'extensions.json');
const devcontainerPath = join(root, '.devcontainer', 'devcontainer.json');

const recommended = readJsonc<ExtensionsJson>(extensionsPath).recommendations ?? [];
const installed =
  readJsonc<DevContainerJson>(devcontainerPath).customizations?.vscode?.extensions ?? [];

const recommendedSet = new Set(recommended);
const installedSet = new Set(installed);

const onlyRecommended = [...recommendedSet].filter((ext) => !installedSet.has(ext)).sort();
const onlyInstalled = [...installedSet].filter((ext) => !recommendedSet.has(ext)).sort();

if (onlyRecommended.length === 0 && onlyInstalled.length === 0) {
  console.log(`vscode-extensions: ${recommended.length} extensions in sync.`);
  process.exit(0);
}

console.error(
  'vscode-extensions: out of sync between .vscode/extensions.json and .devcontainer/devcontainer.json',
);
if (onlyRecommended.length > 0) {
  console.error(`  only in .vscode/extensions.json: ${onlyRecommended.join(', ')}`);
}
if (onlyInstalled.length > 0) {
  console.error(`  only in .devcontainer/devcontainer.json: ${onlyInstalled.join(', ')}`);
}
process.exit(1);
