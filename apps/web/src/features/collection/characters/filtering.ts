// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Element, Rarity } from '@genshin/game-data';
import { compareVersions } from '@genshin/game-data';

export type OwnershipFilter = 'all' | 'owned' | 'unowned';
export type SortField = 'release' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface CharacterFilterState {
  search: string;
  elements: Set<Element>;
  rarities: Set<Rarity>;
  ownership: OwnershipFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

export function initialFilterState(): CharacterFilterState {
  return {
    search: '',
    elements: new Set<Element>(),
    rarities: new Set<Rarity>(),
    ownership: 'all',
    sortField: 'release',
    sortDirection: 'desc',
  };
}

export function filterCharacters(
  characters: readonly Character[],
  filters: CharacterFilterState,
  ownedIds: Set<Character['id']>,
): Character[] {
  const searchLower = filters.search.toLowerCase();

  const result = characters.filter((c) => {
    if (searchLower && !c.name.toLowerCase().includes(searchLower)) return false;
    if (filters.elements.size > 0 && !filters.elements.has(c.element)) return false;
    if (filters.rarities.size > 0 && !filters.rarities.has(c.rarity)) return false;
    if (filters.ownership === 'owned' && !ownedIds.has(c.id)) return false;
    if (filters.ownership === 'unowned' && ownedIds.has(c.id)) return false;
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
