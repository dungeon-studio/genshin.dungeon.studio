// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { renderModule, resolveGeneratedPath, serializeEntry } from './emit.js';

describe('renderModule', () => {
  const rendered = renderModule({
    path: 'src/weapons.generated.ts',
    exportName: 'WEAPON_DATA',
    command: 'weapons',
    entries: [serializeEntry('the-catch', ['rarity: 4,'])],
  });

  it('opens with the SPDX header the REUSE gate requires', () => {
    // REUSE-IgnoreStart
    expect(rendered).toMatch(/^\/\/ SPDX-FileCopyrightText: /);
    expect(rendered).toMatch(/^\/\/ SPDX-License-Identifier: MIT$/m);
    // REUSE-IgnoreEnd
  });

  it('names the subcommand that rewrites the module', () => {
    expect(rendered).toContain('generate weapons');
  });

  it('keys the entries by id in a const assertion, so a duplicate fails typecheck', () => {
    expect(rendered).toContain(
      "export const WEAPON_DATA = {\n  'the-catch': {\n    id: 'the-catch',\n    rarity: 4,\n  },\n} as const;",
    );
  });

  it('ends with a newline, so regeneration leaves nothing for the formatter', () => {
    expect(rendered.endsWith('\n')).toBe(true);
  });
});

describe('resolveGeneratedPath', () => {
  it('lands on the roster @genshin/game-data ships', () => {
    // A generator that resolved elsewhere would write a second, unread roster
    // instead of failing.
    expect(existsSync(resolveGeneratedPath('src/weapons.generated.ts'))).toBe(true);
  });
});
