// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { JsonSchemaProfile } from '@/schemas/json-schema-profile.js';
import { schemaRegistry } from '@/schemas/registry.js';
import { describe, expect, it } from 'vitest';

const schemasDir = fileURLToPath(new URL('.', import.meta.url));
const infraFiles = new Set(['registry.ts', 'registry.test.ts', 'json-schema-profile.ts']);

function findSchemaFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findSchemaFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith('.ts') && !infraFiles.has(entry.name)) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

describe('schemaRegistry', () => {
  it('contains every schema module', async () => {
    const files = findSchemaFiles(schemasDir);
    const registeredPaths = new Set(schemaRegistry.map((e) => e.path));

    for (const file of files) {
      const mod = (await import(file)) as Record<string, unknown>;
      const entry = Object.values(mod).find(
        (v): v is JsonSchemaProfile =>
          typeof v === 'object' && v !== null && 'path' in v && 'schema' in v,
      );

      const relative = file.replace(schemasDir, '');
      expect(entry, `${relative} does not export a JsonSchemaProfile`).toBeDefined();
      expect(registeredPaths, `${entry!.path} from ${relative} is not in the registry`).toContain(
        entry!.path,
      );
    }
  });
});
