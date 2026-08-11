// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { existsSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { renderModule, resolveGeneratedPath } from './emit.js';

describe('renderModule', () => {
  const rendered = renderModule({
    path: 'src/weapons.generated.ts',
    exportName: 'WEAPON_DATA',
    command: 'weapons',
    entries: ["  { id: 'the-catch' },"],
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

  it('wraps the entries in a const assertion', () => {
    expect(rendered).toContain("export const WEAPON_DATA = [\n  { id: 'the-catch' },\n] as const;");
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
