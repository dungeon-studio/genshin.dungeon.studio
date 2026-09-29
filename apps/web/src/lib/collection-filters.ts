// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';

type OwnershipFilter = 'all' | 'owned' | 'unowned';
type SortDirection = 'asc' | 'desc';

/** The sort fields every collection offers, with their display labels. */
export const SORT_FIELDS = [
  { value: 'release', label: 'Release' },
  { value: 'name', label: 'Name' },
] as const;

type SortField = (typeof SORT_FIELDS)[number]['value'];

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

type Comparator<I> = (a: I, b: I) => number;

/** The two ways collections differ when filtered: which category they group by, and how they order by release. */
export interface CollectionFilterConfig<I extends CollectionItem, F extends BaseFilterState, C> {
  category: (item: I) => C;
  selectedCategories: (filters: F) => ReadonlySet<C>;
  compareRelease: Comparator<I>;
}

/**
 * The collection narrowed and ordered for display.
 *
 * An empty category or rarity set means no constraint rather than no matches, so
 * the default state shows everything.
 */
export function filterCollection<I extends CollectionItem, F extends BaseFilterState, C>(
  items: readonly I[],
  filters: F,
  ownedIds: ReadonlySet<string>,
  config: CollectionFilterConfig<I, F, C>,
): I[] {
  return items.filter(matcher(filters, ownedIds, config)).sort(comparator(filters, config));
}

const OWNERSHIP_MATCHES: Record<OwnershipFilter, (owned: boolean) => boolean> = {
  all: () => true,
  owned: (owned) => owned,
  unowned: (owned) => !owned,
};

function allows<T>(selected: ReadonlySet<T>, value: T): boolean {
  return selected.size === 0 || selected.has(value);
}

function matcher<I extends CollectionItem, F extends BaseFilterState, C>(
  filters: F,
  ownedIds: ReadonlySet<string>,
  config: CollectionFilterConfig<I, F, C>,
): (item: I) => boolean {
  const searchLower = filters.search.toLowerCase();
  const categories = config.selectedCategories(filters);
  const ownershipMatches = OWNERSHIP_MATCHES[filters.ownership];

  return (item) =>
    item.name.toLowerCase().includes(searchLower) &&
    allows(categories, config.category(item)) &&
    allows(filters.rarities, item.rarity) &&
    ownershipMatches(ownedIds.has(item.id));
}

const byName: Comparator<CollectionItem> = (a, b) => a.name.localeCompare(b.name);
const byId: Comparator<CollectionItem> = (a, b) => a.id.localeCompare(b.id);

/** Name and then ID break a release tie, so the order is stable. */
function byRelease<I extends CollectionItem>(compareRelease: Comparator<I>): Comparator<I> {
  return (a, b) => compareRelease(a, b) || byName(a, b) || byId(a, b);
}

function comparator<I extends CollectionItem, F extends BaseFilterState, C>(
  filters: F,
  config: CollectionFilterConfig<I, F, C>,
): Comparator<I> {
  const compare = filters.sortField === 'release' ? byRelease(config.compareRelease) : byName;
  return filters.sortDirection === 'desc' ? (a, b) => -compare(a, b) : compare;
}
