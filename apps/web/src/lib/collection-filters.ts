// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';

type OwnershipFilter = 'all' | 'owned' | 'unowned';
type SortDirection = 'asc' | 'desc';

export const SORT_FIELDS = [
  { value: 'release', label: 'Release' },
  { value: 'name', label: 'Name' },
] as const;

type SortField = (typeof SORT_FIELDS)[number]['value'];

/** Each collection extends this with its own category set. */
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

/** `compareRelease` may tie; name and then ID break the tie, so the order is stable. */
export interface CollectionFilterConfig<I extends CollectionItem, F extends BaseFilterState, C> {
  category: (item: I) => C;
  selectedCategories: (filters: F) => ReadonlySet<C>;
  compareRelease: Comparator<I>;
}

/** An empty category or rarity set means no constraint, so the default state shows everything. */
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

/**
 * Case-insensitive substring match. No Unicode normalization or accent
 * folding: a diacritic in a name matches only when the query repeats it.
 * Folding waits for localized display names (#862).
 */
function searchMatcher(query: string): (name: string) => boolean {
  const queryLower = query.toLowerCase();
  return (name) => name.toLowerCase().includes(queryLower);
}

function matcher<I extends CollectionItem, F extends BaseFilterState, C>(
  filters: F,
  ownedIds: ReadonlySet<string>,
  config: CollectionFilterConfig<I, F, C>,
): (item: I) => boolean {
  const searchMatches = searchMatcher(filters.search);
  const categories = config.selectedCategories(filters);
  const ownershipMatches = OWNERSHIP_MATCHES[filters.ownership];

  return (item) =>
    searchMatches(item.name) &&
    allows(categories, config.category(item)) &&
    allows(filters.rarities, item.rarity) &&
    ownershipMatches(ownedIds.has(item.id));
}

// An explicit locale keeps name order a property of the app, not of the viewer's runtime.
const nameCollator = new Intl.Collator('en');

const byName: Comparator<CollectionItem> = (a, b) => nameCollator.compare(a.name, b.name);
const byId: Comparator<CollectionItem> = (a, b) => compareCodeUnits(a.id, b.id);

function compareCodeUnits(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

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
