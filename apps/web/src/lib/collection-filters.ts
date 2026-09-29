// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';

type OwnershipFilter = 'all' | 'owned' | 'unowned';
type SortField = 'release' | 'name';
type SortDirection = 'asc' | 'desc';

/** Fields shared by every collection filter; each concrete state adds its own category set. */
export interface BaseFilterState {
  search: string;
  rarities: Set<Rarity>;
  ownership: OwnershipFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

export function initialBaseFilterState(): BaseFilterState {
  return {
    search: '',
    rarities: new Set<Rarity>(),
    ownership: 'all',
    sortField: 'release',
    sortDirection: 'desc',
  };
}

interface CollectionItem {
  id: string;
  name: string;
  rarity: Rarity;
}

/** The two ways collections differ when filtered: which category they group by, and how they order by release. */
export interface CollectionFilterConfig<I extends CollectionItem, F extends BaseFilterState, C> {
  category: (item: I) => C;
  selectedCategories: (filters: F) => ReadonlySet<C>;
  compareRelease: (a: I, b: I) => number;
}

/**
 * The collection narrowed and ordered for display.
 *
 * An empty category or rarity set means no constraint rather than no matches, so
 * the default state shows everything.
 *
 * Name and then ID break a release tie, so the order is stable.
 */
export function filterCollection<I extends CollectionItem, F extends BaseFilterState, C>(
  items: readonly I[],
  filters: F,
  ownedIds: ReadonlySet<string>,
  config: CollectionFilterConfig<I, F, C>,
): I[] {
  const searchLower = filters.search.toLowerCase();
  const categories = config.selectedCategories(filters);

  const result = items.filter((item) => {
    if (searchLower && !item.name.toLowerCase().includes(searchLower)) return false;
    if (categories.size > 0 && !categories.has(config.category(item))) return false;
    if (filters.rarities.size > 0 && !filters.rarities.has(item.rarity)) return false;
    if (filters.ownership === 'owned' && !ownedIds.has(item.id)) return false;
    if (filters.ownership === 'unowned' && ownedIds.has(item.id)) return false;
    return true;
  });

  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortField) {
      case 'release':
        cmp = config.compareRelease(a, b);
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
