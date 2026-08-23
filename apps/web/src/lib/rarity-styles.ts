// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Tailwind classes for each star rating, one map per role a component needs.
 *
 * Written out rather than built from a template, on the same reasoning as the
 * element styles. Only 5- and 4-star are distinguished, because nothing below
 * that reaches a catalogue; the rest share a neutral so a future addition
 * renders rather than crashing.
 */

import type { Rarity } from '@genshin/game-data';

export const RARITY_BORDER_COLORS: Record<Rarity, string> = {
  5: 'border-l-geo-dark',
  4: 'border-l-geo',
  3: 'border-l-muted-foreground',
  2: 'border-l-muted-foreground',
  1: 'border-l-muted-foreground',
};

export const RARITY_SELECTED_RINGS: Record<Rarity, string> = {
  5: 'ring-geo-dark',
  4: 'ring-geo',
  3: 'ring-muted-foreground',
  2: 'ring-muted-foreground',
  1: 'ring-muted-foreground',
};
