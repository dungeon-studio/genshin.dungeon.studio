// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import type { BaseFilterState } from '@/lib/collection-filters';
import { SORT_FIELDS } from '@/lib/collection-filters';

interface SortControlProps<F extends BaseFilterState> {
  filters: F;
  onChange: (filters: F) => void;
}

export function SortControl<F extends BaseFilterState>({
  filters,
  onChange,
}: SortControlProps<F>): JSX.Element {
  const fieldIndex = SORT_FIELDS.findIndex((f) => f.value === filters.sortField);
  const field = SORT_FIELDS[fieldIndex];
  const nextField = SORT_FIELDS[(fieldIndex + 1) % SORT_FIELDS.length];
  const ascending = filters.sortDirection === 'asc';

  function cycleField() {
    if (nextField) onChange({ ...filters, sortField: nextField.value });
  }

  function toggleDirection() {
    onChange({ ...filters, sortDirection: ascending ? 'desc' : 'asc' });
  }

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={cycleField}
        aria-label={`Sort by: ${field?.label}, switch to ${nextField?.label}`}
        className="rounded-r-none"
      >
        {field?.label}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleDirection}
        aria-label={
          ascending
            ? 'Sort order: ascending, switch to descending'
            : 'Sort order: descending, switch to ascending'
        }
        className="px-1.5 -ml-px rounded-l-none"
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
