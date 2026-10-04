// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';
import { useId, useState } from 'react';

import type { BaseFilterState } from '@/lib/collection-filters';
import { cn } from '@/lib/utils';

import { FilterChips } from './filter-chips';
import { FilterSummary } from './filter-summary';
import { FilterToggle } from './filter-toggle';
import { SearchField } from './search-field';
import { SortControl } from './sort-control';
import type { FilterCategoryConfig, FilterCounts, Noun } from './types';

interface CollectionToolbarProps<F extends BaseFilterState, T extends string> extends FilterCounts {
  filters: F;
  onChange: (filters: F) => void;
  category: FilterCategoryConfig<T>;
  /** What the summary counts, e.g. characters. */
  noun: Noun;
  searchLabel: string;
  showOwnership?: boolean;
  /** Hide the filter chips behind a toggle below the `sm` breakpoint. */
  collapsible?: boolean;
}

/**
 * The search, filter, and sort row every collection page shares.
 *
 * Generic over both the filter state and the one category that differs between
 * collections, which is what lets characters filter by element and weapons by
 * type through the same component. A new collection supplies a
 * {@link FilterCategoryConfig} rather than a new toolbar.
 *
 * Controlled: it holds no filter state and hands a whole new `F` to `onChange`.
 */
export function CollectionToolbar<F extends BaseFilterState, T extends string>({
  filters,
  onChange,
  category,
  noun,
  searchLabel,
  showOwnership = true,
  collapsible = false,
  ...counts
}: CollectionToolbarProps<F, T>): JSX.Element {
  const showCategory = category.show ?? true;
  const controlsId = useId();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="space-y-1.5">
      {/* Wraps rather than squeezing the search box below its placeholder on ~320px screens. */}
      <div className="gap-1.5 flex flex-wrap items-center">
        <SearchField
          value={filters.search}
          onChange={(search) => onChange({ ...filters, search })}
          label={searchLabel}
        />

        {/* Held together so the slack falls before the pair, not between them. */}
        <div className="gap-1.5 ml-auto flex shrink-0 items-center">
          <FilterSummary noun={noun} showOwnership={showOwnership} {...counts} />
          <SortControl filters={filters} onChange={onChange} />
        </div>
      </div>

      {collapsible && (
        <div className="sm:hidden">
          <FilterToggle
            expanded={expanded}
            onToggle={() => setExpanded((wasExpanded) => !wasExpanded)}
            activeCount={countActiveFilters(
              filters,
              showCategory ? category.selected.size : 0,
              showOwnership,
            )}
            controlsId={controlsId}
          />
        </div>
      )}

      <div id={controlsId} className={cn(collapsible && !expanded && 'sm:block hidden')}>
        <FilterChips
          filters={filters}
          onChange={onChange}
          category={category}
          showCategory={showCategory}
          showOwnership={showOwnership}
        />
      </div>
    </div>
  );
}

/** Sorting reorders rather than narrows, so it never counts. */
function countActiveFilters(
  filters: BaseFilterState,
  selectedCategoryCount: number,
  showOwnership: boolean,
): number {
  return (
    (filters.search ? 1 : 0) +
    filters.rarities.size +
    selectedCategoryCount +
    (showOwnership && filters.ownership !== 'all' ? 1 : 0)
  );
}
