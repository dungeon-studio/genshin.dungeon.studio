// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { afterEach, describe, expect, it, vi } from 'vitest';

const ROSTERS = [
  { module: './characters.js', roster: 'CHARACTER_ROSTER' },
  { module: './weapons.js', roster: 'WEAPON_ROSTER' },
  { module: './artifacts.js', roster: 'ARTIFACT_SET_ROSTER' },
];

const NEWER = { major: 99, minor: 0 };

describe('GAME_DATA_VERSION', () => {
  afterEach(() => {
    for (const { module } of ROSTERS) vi.doUnmock(module);
    vi.resetModules();
  });

  it.each(ROSTERS)('rises to a newer patch in $roster', async ({ module, roster }) => {
    vi.doMock(module, async (importOriginal) => ({
      ...(await importOriginal<Record<string, unknown>>()),
      [roster]: [{ version: NEWER }],
    }));

    const { GAME_DATA_VERSION } = await import('./game-data-version.js');

    expect(GAME_DATA_VERSION).toBe(NEWER);
  });
});
