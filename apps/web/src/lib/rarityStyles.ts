// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';

export const RARITY_BORDER_COLORS: Record<Rarity, string> = {
  5: 'border-l-geo-dark',
  4: 'border-l-geo',
  3: 'border-l-muted-foreground',
  2: 'border-l-muted-foreground',
  1: 'border-l-muted-foreground',
};

export const RARITY_BORDER_COLORS_DIM: Record<Rarity, string> = {
  5: 'border-l-geo-dark/30',
  4: 'border-l-geo/30',
  3: 'border-l-muted-foreground/30',
  2: 'border-l-muted-foreground/30',
  1: 'border-l-muted-foreground/30',
};
