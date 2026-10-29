// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ArrowDownWideNarrow, ArrowUpNarrowWide } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import type { BaseFilterState } from '@/lib/collection-filters';
import { cycleLabel } from '@/lib/cycle-label';

type SortField = BaseFilterState['sortField'];
type SortDirection = BaseFilterState['sortDirection'];

const NEXT_FIELD: Record<SortField, SortField> = {
  release: 'name',
  name: 'release',
};

const FIELD_LABELS: Record<SortField, string> = {
  release: 'Release',
  name: 'Name',
};

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
}: SortControlProps<F>): JSX.Element {
  const field = filters.sortField;
  const nextField = NEXT_FIELD[field];
  const direction = filters.sortDirection;
  const nextDirection = NEXT_DIRECTION[direction];

  return (
    <div className="flex items-center">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...filters, sortField: nextField })}
        aria-label={cycleLabel('Sort by', FIELD_LABELS[field], FIELD_LABELS[nextField])}
        className="rounded-r-none"
      >
        {FIELD_LABELS[field]}
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
