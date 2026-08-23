// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Element, Rarity } from '@genshin/game-data';

import type { OwnershipFilter, SortDirection } from '@/lib/collection-filters';

type SortField = 'release' | 'name';

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

/**
 * The roster narrowed and ordered for display.
 *
 * An empty element or rarity set means no constraint rather than no matches, so
 * the default state shows everything.
 *
 * Ordering by release uses each character's release date, which separates
 * characters that shipped in one version. Name and then ID break any remaining
 * tie, so the order is stable.
 */
export function filterCharacters(
  characters: readonly Character[],
  filters: CharacterFilterState,
  ownedIds: ReadonlySet<string>,
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
        cmp = a.releaseDate.localeCompare(b.releaseDate);
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
