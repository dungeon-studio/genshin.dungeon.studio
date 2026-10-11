// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_ROSTER, WEAPON_ROSTER } from '@genshin/game-data';
import { assert } from 'vitest';

function rosterEntry<T>(roster: readonly T[], index: number): T {
  const entry = roster[index];
  assert.isDefined(entry, `game data has no roster entry ${index}`);
  return entry;
}

// Any entry satisfies the repository suites. Taking them from game data keeps a
// roster change from stranding a suite on one that no longer exists.
export const CHARACTER = rosterEntry(CHARACTER_ROSTER, 0);
export const WEAPON = rosterEntry(WEAPON_ROSTER, 0);

/** Distinct from `WEAPON`, so a filtered read has something to leave out. */
export const OTHER_WEAPON = rosterEntry(WEAPON_ROSTER, 1);
