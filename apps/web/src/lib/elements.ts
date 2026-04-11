// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from '@genshin/game-data';

type IconVariant = 'light' | 'dark';

const ELEMENT_ICON_FILES: Record<Element, Record<IconVariant, string>> = {
  Pyro: { light: 'pyro-light.png', dark: 'pyro-dark.png' },
  Hydro: { light: 'hydro-light.png', dark: 'hydro-dark.png' },
  Anemo: { light: 'anemo-light.png', dark: 'anemo-dark.png' },
  Electro: { light: 'electro-light.png', dark: 'electro-dark.png' },
  Dendro: { light: 'dendro-light.png', dark: 'dendro-dark.png' },
  Cryo: { light: 'cryo-light.png', dark: 'cryo-dark.png' },
  Geo: { light: 'geo-light.png', dark: 'geo-dark.png' },
};

export function getElementIconPath(element: Element, variant: IconVariant = 'light'): string {
  return `/elements/${ELEMENT_ICON_FILES[element][variant]}`;
}
