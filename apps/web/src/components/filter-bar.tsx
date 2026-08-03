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
  /** Hide the filter chips behind a toggle below the `sm` breakpoint. */
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
  const controlsId = useId();
  const [expanded, setExpanded] = useState(false);

  // Sorting reorders rather than narrows, so it never counts.
  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.rarities.size +
    (showCategory ? category.selected.size : 0) +
    (showOwnership && filters.ownership !== 'all' ? 1 : 0);

  return (
    <div className="space-y-1.5">
      {/* Wraps rather than squeezing the search box below its placeholder on ~320px screens. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <SearchField
          value={filters.search}
          onChange={(search) => onChange({ ...filters, search })}
          label={searchLabel}
        />

        {/* Held together so the slack falls before the pair, not between them. */}
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <FilterSummary noun={noun} showOwnership={showOwnership} {...counts} />
          <SortControl filters={filters} onChange={onChange} sortFields={sortFields} />
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

      <div id={controlsId} className={cn(collapsible && !expanded && 'hidden sm:block')}>
        <FilterChips
          filters={filters}
          onChange={onChange}
          category={category}
          showOwnership={showOwnership}
        />
      </div>
    </div>
  );
}

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
}

function SearchField({ value, onChange, label }: SearchFieldProps): JSX.Element {
  return (
    <div className="relative min-w-28 flex-1 md:max-w-md">
      <Search
        className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
        focusable={false}
      />
      <Input
        type="search"
        placeholder="Search…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-9 text-xs [&::-webkit-search-cancel-button]:grayscale"
        aria-label={label}
      />
    </div>
  );
}

interface SortControlProps<F extends BaseFilterState> {
  filters: F;
  onChange: (filters: F) => void;
  sortFields: readonly { value: F['sortField']; label: string }[];
}

function SortControl<F extends BaseFilterState>({
  filters,
  onChange,
  sortFields,
}: SortControlProps<F>): JSX.Element {
  const label = sortFields.find((f) => f.value === filters.sortField)?.label ?? '';
  const ascending = filters.sortDirection === 'asc';

  function cycleField() {
    const currentIndex = sortFields.findIndex((f) => f.value === filters.sortField);
    onChange({ ...filters, sortField: sortFields[(currentIndex + 1) % sortFields.length].value });
  }

  function toggleDirection() {
    onChange({ ...filters, sortDirection: ascending ? 'desc' : 'asc' });
  }

  return (
    <div className="flex items-center">
      <Button variant="outline" size="sm" onClick={cycleField} className="rounded-r-none">
        {label}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        aria-label={`Sort ${ascending ? 'ascending' : 'descending'}`}
        className="-ml-px rounded-l-none px-1.5"
      >
        {ascending ? (
          <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
        ) : (
          <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
        )}
      </Button>
    </div>
  );
}

const CHIP = 'rounded-full px-2.5 py-1 text-xs font-medium transition-colors';
const CHIP_IDLE = 'bg-muted text-muted-foreground hover:bg-muted/80';

interface FilterChipsProps<F extends BaseFilterState, T extends string> {
  filters: F;
  onChange: (filters: F) => void;
  category: FilterCategoryConfig<T>;
  showOwnership: boolean;
}

function FilterChips<F extends BaseFilterState, T extends string>({
  filters,
  onChange,
  category,
  showOwnership,
}: FilterChipsProps<F, T>): JSX.Element {
  const showCategory = category.show ?? true;

  function toggleRarity(rarity: Rarity) {
    onChange({ ...filters, rarities: toggleInSet(filters.rarities, rarity) });
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {showOwnership &&
        (['all', 'owned', 'unowned'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...filters, ownership: value })}
            className={cn(
              CHIP,
              'capitalize',
              filters.ownership === value ? 'bg-foreground text-background' : CHIP_IDLE,
            )}
            aria-pressed={filters.ownership === value}
          >
            {value}
          </button>
        ))}

      {showOwnership && <ChipDivider />}

      {RARITY_VALUES.map((rarity) => (
        <button
          key={rarity}
          type="button"
          onClick={() => toggleRarity(rarity)}
          className={cn(CHIP, filters.rarities.has(rarity) ? 'bg-geo-dark text-white' : CHIP_IDLE)}
          aria-pressed={filters.rarities.has(rarity)}
          aria-label={`Filter by ${rarity}-star`}
        >
          {rarity}★
        </button>
      ))}

      {showCategory && <ChipDivider />}

      {showCategory &&
        category.values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => category.onToggle(value)}
            className={cn(
              CHIP,
              'inline-flex items-center gap-1.5',
              category.selected.has(value) ? category.activeClassName(value) : CHIP_IDLE,
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
  );
}

function ChipDivider(): JSX.Element {
  return (
    <span className="self-center text-border" aria-hidden="true">
      |
    </span>
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

function FilterSummary(props: FilterSummaryProps): JSX.Element {
  return <p className="shrink-0 text-sm text-muted-foreground">{summaryText(props)}</p>;
}

function summaryText({
  noun,
  showOwnership,
  filteredCount,
  totalCount,
  ownedCount,
  filteredOwnedCount,
}: FilterSummaryProps): string {
  if (!showOwnership) return `${filteredCount} ${noun}`;
  if (filteredCount === totalCount) return `${ownedCount} / ${totalCount} owned`;
  return `${filteredOwnedCount} / ${filteredCount} owned`;
}
