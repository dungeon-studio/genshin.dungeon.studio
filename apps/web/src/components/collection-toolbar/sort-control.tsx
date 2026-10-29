// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import type { BaseFilterState } from '@/lib/collection-filters';
import { SORT_FIELDS } from '@/lib/collection-filters';
import { cycleLabel } from '@/lib/cycle-label';

type SortDirection = BaseFilterState['sortDirection'];

const NEXT_DIRECTION: Record<SortDirection, SortDirection> = {
  asc: 'desc',
  desc: 'asc',
};

const DIRECTION_NAMES: Record<SortDirection, string> = {
  asc: 'ascending',
  desc: 'descending',
};

interface SortControlProps<F extends BaseFilterState> {
  filters: F;
  onChange: (filters: F) => void;
}

export function SortControl<F extends BaseFilterState>({
  filters,
  onChange,
}: SortControlProps<F>): JSX.Element | null {
  const fieldIndex = SORT_FIELDS.findIndex((f) => f.value === filters.sortField);
  const field = SORT_FIELDS[fieldIndex];
  const nextField = SORT_FIELDS[(fieldIndex + 1) % SORT_FIELDS.length];
  if (!field || !nextField) return null;

  const direction = filters.sortDirection;
  const nextDirection = NEXT_DIRECTION[direction];

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...filters, sortField: nextField.value })}
        aria-label={cycleLabel('Sort by', field.label, nextField.label)}
        className="rounded-r-none"
      >
        {field.label}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...filters, sortDirection: nextDirection })}
        aria-label={cycleLabel(
          'Sort order',
          DIRECTION_NAMES[direction],
          DIRECTION_NAMES[nextDirection],
        )}
        className="px-1.5 -ml-px rounded-l-none"
      >
        {direction === 'asc' ? (
          <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
        ) : (
          <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
        )}
      </Button>
    </div>
  );
}
