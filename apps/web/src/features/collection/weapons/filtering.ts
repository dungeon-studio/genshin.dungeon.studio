// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity, Weapon, WeaponType } from '@genshin/game-data';
import { compareVersions } from '@genshin/game-data';

export type OwnershipFilter = 'all' | 'owned' | 'unowned';
export type SortField = 'release' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface WeaponFilterState {
  search: string;
  weaponTypes: Set<WeaponType>;
  rarities: Set<Rarity>;
  ownership: OwnershipFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

export function initialFilterState(): WeaponFilterState {
  return {
    search: '',
    weaponTypes: new Set<WeaponType>(),
    rarities: new Set<Rarity>(),
    ownership: 'all',
    sortField: 'release',
    sortDirection: 'desc',
  };
}

export function filterWeapons(
  weapons: readonly Weapon[],
  filters: WeaponFilterState,
  ownedWeaponIds: Set<Weapon['id']>,
): Weapon[] {
  const searchLower = filters.search.toLowerCase();

  const result = weapons.filter((w) => {
    if (searchLower && !w.name.toLowerCase().includes(searchLower)) return false;
    if (filters.weaponTypes.size > 0 && !filters.weaponTypes.has(w.type)) return false;
    if (filters.rarities.size > 0 && !filters.rarities.has(w.rarity)) return false;
    if (filters.ownership === 'owned' && !ownedWeaponIds.has(w.id)) return false;
    if (filters.ownership === 'unowned' && ownedWeaponIds.has(w.id)) return false;
    return true;
  });

  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortField) {
      case 'release':
        cmp = compareVersions(a.version, b.version);
        if (cmp === 0) {
          cmp = a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
        }
        break;
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
    }
    return filters.sortDirection === 'desc' ? -cmp : cmp;
  });

  return result;
}
