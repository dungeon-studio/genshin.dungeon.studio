// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Element, Rarity } from '@genshin/game-data';
import { compareVersions, ELEMENTS } from '@genshin/game-data';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ELEMENT_BG_COLORS } from '@/lib/elementStyles';
import { getElementIconPath } from '@/lib/elements';
import { cn } from '@/lib/utils';

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

interface CharacterFiltersProps {
  filters: CharacterFilterState;
  onChange: (filters: CharacterFilterState) => void;
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  filteredOwnedCount: number;
  showOwnership?: boolean;
}

const ELEMENT_VALUES = Object.values(ELEMENTS);
const RARITY_VALUES: Rarity[] = [5, 4];

const SORT_LABELS: Record<SortField, string> = {
  release: 'Release',
  name: 'Name',
};

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

export function CharacterFilters({
  filters,
  onChange,
  filteredCount,
  totalCount,
  ownedCount,
  filteredOwnedCount,
  showOwnership = true,
}: CharacterFiltersProps) {
  function toggleElement(element: Element) {
    const next = new Set(filters.elements);
    if (next.has(element)) {
      next.delete(element);
    } else {
      next.add(element);
    }
    onChange({ ...filters, elements: next });
  }

  function toggleRarity(rarity: Rarity) {
    const next = new Set(filters.rarities);
    if (next.has(rarity)) {
      next.delete(rarity);
    } else {
      next.add(rarity);
    }
    onChange({ ...filters, rarities: next });
  }

  function cycleSortField() {
    const fields: SortField[] = ['release', 'name'];
    const currentIndex = fields.indexOf(filters.sortField);
    const nextField = fields[(currentIndex + 1) % fields.length];
    onChange({ ...filters, sortField: nextField });
  }

  function toggleSortDirection() {
    onChange({
      ...filters,
      sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  }

  return (
    <div className="space-y-1.5">
      {/* Row 1: Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Ownership filters */}
        {showOwnership &&
          (['all', 'owned', 'unowned'] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...filters, ownership: value })}
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors',
                filters.ownership === value
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              aria-pressed={filters.ownership === value}
            >
              {value}
            </button>
          ))}

        {showOwnership && (
          <span className="self-center text-border" aria-hidden="true">
            |
          </span>
        )}

        {/* Rarity filters */}
        {RARITY_VALUES.map((rarity) => (
          <button
            key={rarity}
            type="button"
            onClick={() => toggleRarity(rarity)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              filters.rarities.has(rarity)
                ? 'bg-geo-dark text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            aria-pressed={filters.rarities.has(rarity)}
            aria-label={`Filter by ${rarity}-star`}
          >
            {rarity}★
          </button>
        ))}

        <span className="self-center text-border" aria-hidden="true">
          |
        </span>

        {/* Element filters */}
        {ELEMENT_VALUES.map((element) => (
          <button
            key={element}
            type="button"
            onClick={() => toggleElement(element)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              filters.elements.has(element)
                ? ELEMENT_BG_COLORS[element]
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            aria-pressed={filters.elements.has(element)}
            aria-label={`Filter by ${element}`}
          >
            <img
              src={getElementIconPath(element)}
              alt=""
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
            {element}
          </button>
        ))}
      </div>

      {/* Row 2: Search + status + sort */}
      <div className="flex items-center gap-1.5">
        <div className="relative w-1/2 lg:w-1/3">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <Input
            type="search"
            placeholder="Search…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-8 pl-9 text-xs [&::-webkit-search-cancel-button]:grayscale"
            aria-label="Search characters by name"
          />
        </div>

        <div className="flex-1" />

        <p className="text-sm text-muted-foreground">
          {!showOwnership ? (
            <>{filteredCount} characters</>
          ) : filteredCount === totalCount ? (
            <>
              {ownedCount} / {totalCount} owned
            </>
          ) : (
            <>
              {filteredOwnedCount} / {filteredCount} owned
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center">
          <Button variant="outline" size="sm" onClick={cycleSortField} className="rounded-r-none">
            {SORT_LABELS[filters.sortField]}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortDirection}
            aria-label={`Sort ${filters.sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            className="-ml-px rounded-l-none px-1.5"
          >
            {filters.sortDirection === 'asc' ? (
              <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
            ) : (
              <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
