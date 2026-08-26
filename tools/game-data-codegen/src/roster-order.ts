// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';

/** The fields every generated roster orders by, whatever else its records carry. */
interface Dated {
  name: string;
  version: string;
}

/**
 * Newest version first, with name breaking ties so a regeneration that changes
 * no data produces no diff. Rosters that rank by rarity apply it first and fall
 * through to this.
 */
export function byVersionThenName(a: Dated, b: Dated): number {
  return compareVersions(b.version, a.version) || a.name.localeCompare(b.name);
}
