// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, toggleInSet } from '@/lib/utils';

type OwnershipFilter = 'all' | 'owned' | 'unowned';
type SortDirection = 'asc' | 'desc';

/** Fields shared by every collection filter; each concrete state adds its own category set, driven separately via {@link FilterCategoryConfig}. */
export interface BaseFilterState {
  search: string;
  rarities: Set<Rarity>;
  ownership: OwnershipFilter;
  sortField: string;
  sortDirection: SortDirection;
}

/** Configures the one filter row that differs between collection types. */
export interface FilterCategoryConfig<T extends string> {
  values: readonly T[];
  selected: Set<T>;
  onToggle: (value: T) => void;
  /** Active-state classes for a value, e.g. per-element background color. */
  activeClassName: (value: T) => string;
  iconPath: (value: T, variant: 'light' | 'dark') => string;
  /** Render the category row (default true). */
  show?: boolean;
}

interface FilterBarProps<F extends BaseFilterState, T extends string> {
  filters: F;
  onChange: (filters: F) => void;
  category: FilterCategoryConfig<T>;
  sortFields: readonly { value: F['sortField']; label: string }[];
  /** Plural noun for the status line, e.g. "characters". */
  noun: string;
  searchLabel: string;
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  filteredOwnedCount: number;
  showOwnership?: boolean;
}

const RARITY_VALUES: Rarity[] = [5, 4];

export function FilterBar<F extends BaseFilterState, T extends string>({
  filters,
  onChange,
  category,
  sortFields,
  noun,
  searchLabel,
  filteredCount,
  totalCount,
  ownedCount,
  filteredOwnedCount,
  showOwnership = true,
}: FilterBarProps<F, T>): JSX.Element {
  const showCategory = category.show ?? true;
  const sortLabel = sortFields.find((f) => f.value === filters.sortField)?.label ?? '';

  function toggleRarity(rarity: Rarity) {
    onChange({ ...filters, rarities: toggleInSet(filters.rarities, rarity) });
  }

  function cycleSortField() {
    const currentIndex = sortFields.findIndex((f) => f.value === filters.sortField);
    const nextField = sortFields[(currentIndex + 1) % sortFields.length].value;
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
      <div className="flex flex-wrap items-center gap-1.5">
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

        {showCategory && (
          <span className="self-center text-border" aria-hidden="true">
            |
          </span>
        )}

        {showCategory &&
          category.values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => category.onToggle(value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                category.selected.has(value)
                  ? category.activeClassName(value)
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
              aria-pressed={category.selected.has(value)}
              aria-label={`Filter by ${value}`}
            >
              <img
                src={category.iconPath(value, 'light')}
                alt=""
                className="h-3.5 w-3.5 dark:hidden"
                aria-hidden="true"
              />
              <img
                src={category.iconPath(value, 'dark')}
                alt=""
                className="hidden h-3.5 w-3.5 dark:block"
                aria-hidden="true"
              />
              {value}
            </button>
          ))}
      </div>

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
            aria-label={searchLabel}
          />
        </div>

        <div className="flex-1" />

        <p className="text-sm text-muted-foreground">
          {!showOwnership ? (
            <>
              {filteredCount} {noun}
            </>
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
            {sortLabel}
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
