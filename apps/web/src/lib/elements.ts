// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from '@genshin/game-data';

const ELEMENT_ICON_FILES: Record<Element, string> = {
  Pyro: 'pyro.png',
  Hydro: 'hydro.png',
  Anemo: 'anemo.png',
  Electro: 'electro.png',
  Dendro: 'dendro.png',
  Cryo: 'cryo.png',
  Geo: 'geo.png',
};

export function getElementIconPath(element: Element): string {
  return `/elements/${ELEMENT_ICON_FILES[element]}`;
}
