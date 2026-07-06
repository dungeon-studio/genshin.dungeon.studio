// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from '@genshin/game-data';
import { ELEMENTS } from '@genshin/game-data';
import type { JSX } from 'react';

import { FilterBar } from '@/components/filter-bar';
import { ELEMENT_BG_COLORS } from '@/lib/element-styles';
import { getElementIconPath } from '@/lib/elements';

import type { CharacterFilterState } from './filtering';

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

const SORT_FIELDS = [
  { value: 'release', label: 'Release' },
  { value: 'name', label: 'Name' },
] as const;

export function CharacterFilters({
  filters,
  onChange,
  showOwnership = true,
  ...counts
}: CharacterFiltersProps): JSX.Element {
  function toggleElement(element: Element) {
    const next = new Set(filters.elements);
    if (next.has(element)) {
      next.delete(element);
    } else {
      next.add(element);
    }
    onChange({ ...filters, elements: next });
  }

  return (
    <FilterBar
      filters={filters}
      onChange={onChange}
      sortFields={SORT_FIELDS}
      noun="characters"
      searchLabel="Search characters by name"
      showOwnership={showOwnership}
      category={{
        values: ELEMENT_VALUES,
        selected: filters.elements,
        onToggle: toggleElement,
        activeClassName: (element) => ELEMENT_BG_COLORS[element],
        iconPath: getElementIconPath,
      }}
      {...counts}
    />
  );
}
