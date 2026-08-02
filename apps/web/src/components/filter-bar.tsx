// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ChevronDown,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type { JSX } from 'react';
import { useId, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toggleInSet } from '@/lib/toggle-in-set';
import { cn } from '@/lib/utils';

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

interface FilterCounts {
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  filteredOwnedCount: number;
}

interface FilterBarProps<F extends BaseFilterState, T extends string> extends FilterCounts {
  filters: F;
  onChange: (filters: F) => void;
  category: FilterCategoryConfig<T>;
  sortFields: readonly { value: F['sortField']; label: string }[];
  /** Plural noun for the summary, e.g. "characters". */
  noun: string;
  searchLabel: string;
  showOwnership?: boolean;
  /** Hide the controls behind a toggle below the `sm` breakpoint. */
  collapsible?: boolean;
}

const RARITY_VALUES: Rarity[] = [5, 4];

export function FilterBar<F extends BaseFilterState, T extends string>({
  filters,
  onChange,
  category,
  sortFields,
  noun,
  searchLabel,
  showOwnership = true,
  collapsible = false,
  ...counts
}: FilterBarProps<F, T>): JSX.Element {
  const showCategory = category.show ?? true;
  const sortLabel = sortFields.find((f) => f.value === filters.sortField)?.label ?? '';
  const controlsId = useId();
  const [expanded, setExpanded] = useState(false);

  // Sorting reorders rather than narrows, so it never counts.
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.rarities.size +
    (showCategory ? category.selected.size : 0) +
    (showOwnership && filters.ownership !== 'all' ? 1 : 0);

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
      {/* Wraps rather than squeezing the search box below its placeholder on ~320px screens. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <div className="relative min-w-28 flex-1 md:max-w-md">
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

        <FilterSummary noun={noun} showOwnership={showOwnership} {...counts} />

        <div className="ml-auto flex shrink-0 items-center">
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

      {collapsible && (
        <div className="sm:hidden">
          <FilterToggle
            expanded={expanded}
            onToggle={() => setExpanded((wasExpanded) => !wasExpanded)}
            activeCount={activeFilterCount}
            controlsId={controlsId}
          />
        </div>
      )}

      <div
        id={controlsId}
        className={cn(
          'flex flex-wrap items-center gap-1.5',
          collapsible && !expanded && 'hidden sm:flex',
        )}
      >
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
    </div>
  );
}

interface FilterToggleProps {
  expanded: boolean;
  onToggle: () => void;
  activeCount: number;
  controlsId: string;
}

function FilterToggle({
  expanded,
  onToggle,
  activeCount,
  controlsId,
}: FilterToggleProps): JSX.Element {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controlsId}
      // Without an explicit label the badge joins the text: "Filters3".
      aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
      Filters
      {activeCount > 0 && (
        <span className="rounded-full bg-foreground px-1.5 text-xs font-medium text-background">
          {activeCount}
        </span>
      )}
      {/* Turning marks the state change, so neither direction has to be read as a fixed meaning. */}
      <ChevronDown
        className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
        aria-hidden="true"
        focusable={false}
      />
    </Button>
  );
}

interface FilterSummaryProps extends FilterCounts {
  noun: string;
  showOwnership: boolean;
}

function FilterSummary({
  noun,
  showOwnership,
  filteredCount,
  totalCount,
  ownedCount,
  filteredOwnedCount,
}: FilterSummaryProps): JSX.Element {
  const text = 'shrink-0 text-sm text-muted-foreground';

  if (!showOwnership) {
    return (
      <p className={text}>
        {filteredCount} {noun}
      </p>
    );
  }

  if (filteredCount === totalCount) {
    return (
      <p className={text}>
        {ownedCount} / {totalCount} owned
      </p>
    );
  }

  return (
    <p className={text}>
      {filteredOwnedCount} / {filteredCount} owned
    </p>
  );
}
