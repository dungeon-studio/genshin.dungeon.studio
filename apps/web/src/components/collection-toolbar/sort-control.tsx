// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import type { BaseFilterState } from '@/lib/collection-filters';

interface SortControlProps<F extends BaseFilterState> {
  filters: F;
  onChange: (filters: F) => void;
  sortFields: readonly { value: F['sortField']; label: string }[];
}

export function SortControl<F extends BaseFilterState>({
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
