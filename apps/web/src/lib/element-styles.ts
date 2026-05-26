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

export const ELEMENT_BG_COLORS: Record<Element, string> = {
  Pyro: 'bg-pyro-dark text-white',
  Hydro: 'bg-hydro-dark text-white',
  Electro: 'bg-electro-dark text-white',
  Cryo: 'bg-cryo-dark text-white',
  Anemo: 'bg-anemo-dark text-white',
  Geo: 'bg-geo-dark text-white',
  Dendro: 'bg-dendro-dark text-white',
};

export const ELEMENT_BORDER_ALL_COLORS: Record<Element, string> = {
  Pyro: 'border-pyro',
  Hydro: 'border-hydro',
  Electro: 'border-electro',
  Cryo: 'border-cryo',
  Anemo: 'border-anemo',
  Geo: 'border-geo',
  Dendro: 'border-dendro',
};

export function elementBorderClass(element?: Element): string {
  return element ? ELEMENT_BORDER_COLORS[element] : 'border-dashed border-muted-foreground/30';
}
