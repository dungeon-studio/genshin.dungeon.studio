// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon, WeaponType } from '@genshin/game-data';
import { compareVersions } from '@genshin/game-data';

import type { BaseFilterState } from '@/lib/collection-filters';
import { filterCollection, initialBaseFilterState } from '@/lib/collection-filters';

export interface WeaponFilterState extends BaseFilterState {
  weaponTypes: Set<WeaponType>;
}

export function initialFilterState(): WeaponFilterState {
  return { ...initialBaseFilterState(), weaponTypes: new Set<WeaponType>() };
}

/** Weapons carry no release date, so release order uses the version and weapons from one version tie. */
export function filterWeapons(
  weapons: readonly Weapon[],
  filters: WeaponFilterState,
  ownedWeaponIds: ReadonlySet<string>,
): Weapon[] {
  return filterCollection(weapons, filters, ownedWeaponIds, {
    category: (w) => w.type,
    selectedCategories: (f) => f.weaponTypes,
    compareRelease: (a, b) => compareVersions(a.version, b.version),
  });
}
