// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { WeaponType } from '@genshin/game-data';

type IconVariant = 'light' | 'dark';

const WEAPON_TYPE_ICON_FILES: Record<WeaponType, Record<IconVariant, string>> = {
  Sword: { light: 'sword-light.png', dark: 'sword-dark.png' },
  Claymore: { light: 'claymore-light.png', dark: 'claymore-dark.png' },
  Polearm: { light: 'polearm-light.png', dark: 'polearm-dark.png' },
  Bow: { light: 'bow-light.png', dark: 'bow-dark.png' },
  Catalyst: { light: 'catalyst-light.png', dark: 'catalyst-dark.png' },
};

export function getWeaponTypeIconPath(
  weaponType: WeaponType,
  variant: IconVariant = 'light',
): string {
  return `/weapon-types/${WEAPON_TYPE_ICON_FILES[weaponType][variant]}`;
}
