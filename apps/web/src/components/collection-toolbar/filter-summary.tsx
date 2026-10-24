// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';

import type { FilterCounts, Noun } from './types';

interface FilterSummaryProps extends FilterCounts {
  noun: Noun;
  showOwnership: boolean;
}

export function FilterSummary(props: FilterSummaryProps): JSX.Element {
  return <p className="text-sm shrink-0 text-muted-foreground">{summaryText(props)}</p>;
}

function summaryText({
  noun,
  showOwnership,
  filteredCount,
  totalCount,
  ownedCount,
  filteredOwnedCount,
}: FilterSummaryProps): string {
  if (!showOwnership) return formatCount(filteredCount, noun);
  if (filteredCount === totalCount) return `${ownedCount} / ${totalCount} owned`;
  return `${filteredOwnedCount} / ${filteredCount} owned`;
}

function formatCount(count: number, noun: Noun): string {
  return `${count} ${count === 1 ? noun.one : noun.other}`;
}
