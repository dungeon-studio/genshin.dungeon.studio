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

/**
 * The public URL of an element's icon, in the variant for one page theme.
 *
 * A caller usually wants both: `ThemedIcon` renders each and lets CSS hide the
 * one that doesn't match, so the icon follows the theme without a re-render.
 */
export function getElementIconPath(element: Element, variant: IconVariant = 'light'): string {
  return `/elements/${ELEMENT_ICON_FILES[element][variant]}`;
}
