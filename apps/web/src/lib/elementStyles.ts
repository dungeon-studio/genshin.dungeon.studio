// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from '@genshin/game-data';

export const ELEMENT_BORDER_COLORS: Record<Element, string> = {
  Pyro: 'border-l-pyro',
  Hydro: 'border-l-hydro',
  Electro: 'border-l-electro',
  Cryo: 'border-l-cryo',
  Anemo: 'border-l-anemo',
  Geo: 'border-l-geo',
  Dendro: 'border-l-dendro',
};

export const ELEMENT_BORDER_COLORS_DIM: Record<Element, string> = {
  Pyro: 'border-l-pyro/30',
  Hydro: 'border-l-hydro/30',
  Electro: 'border-l-electro/30',
  Cryo: 'border-l-cryo/30',
  Anemo: 'border-l-anemo/30',
  Geo: 'border-l-geo/30',
  Dendro: 'border-l-dendro/30',
};

export const ELEMENT_SELECTED_RINGS: Record<Element, string> = {
  Pyro: 'ring-pyro',
  Hydro: 'ring-hydro',
  Electro: 'ring-electro',
  Cryo: 'ring-cryo',
  Anemo: 'ring-anemo',
  Geo: 'ring-geo',
  Dendro: 'ring-dendro',
};

export const ELEMENT_FOCUS_RINGS: Record<Element, string> = {
  Pyro: 'focus-visible:ring-pyro',
  Hydro: 'focus-visible:ring-hydro',
  Electro: 'focus-visible:ring-electro',
  Cryo: 'focus-visible:ring-cryo',
  Anemo: 'focus-visible:ring-anemo',
  Geo: 'focus-visible:ring-geo',
  Dendro: 'focus-visible:ring-dendro',
};
