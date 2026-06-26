// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { AlpsProfile } from '@/profiles/alps/profile.js';
import { alpsRegistry } from '@/profiles/alps/registry.js';
import { describe, expect, it } from 'vitest';

const profilesDir = fileURLToPath(new URL('.', import.meta.url));
const infraFiles = new Set(['registry.ts', 'registry.test.ts', 'profile.ts']);

function findProfileFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findProfileFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith('.ts') && !infraFiles.has(entry.name)) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

describe('alpsRegistry', () => {
  it('contains every profile module', async () => {
    const files = findProfileFiles(profilesDir);
    const registeredPaths = new Set(alpsRegistry.map((e) => e.path));

    for (const file of files) {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
      const entry = Object.values(mod).find(
        (v): v is AlpsProfile =>
          typeof v === 'object' && v !== null && 'path' in v && 'profile' in v,
      );

      const relative = file.replace(profilesDir, '');
      expect(entry, `${relative} does not export an AlpsProfile`).toBeDefined();
      if (entry === undefined) {
        throw new Error(`${relative} does not export an AlpsProfile`);
      }
      expect(registeredPaths, `${entry.path} from ${relative} is not in the registry`).toContain(
        entry.path,
      );
    }
  });
});
