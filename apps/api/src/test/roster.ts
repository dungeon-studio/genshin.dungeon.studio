// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_ROSTER, WEAPON_ROSTER } from '@genshin/game-data';
import { assert } from 'vitest';

function rosterEntry<T>(roster: readonly T[], index: number): T {
  const entry = roster[index];
  assert.isDefined(entry, `game data has no roster entry ${index}`);
  return entry;
}

// Any entry satisfies the repository suites, so they take one from game data
// rather than hard-code an id the roster might drop.
export const CHARACTER = rosterEntry(CHARACTER_ROSTER, 0);
export const WEAPON = rosterEntry(WEAPON_ROSTER, 0);

/** Distinct from `WEAPON`, so a filtered read has something to leave out. */
export const OTHER_WEAPON = rosterEntry(WEAPON_ROSTER, 1);
