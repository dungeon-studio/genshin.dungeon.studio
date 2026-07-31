// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Element } from '@genshin/game-data';
import { ELEMENTS } from '@genshin/game-data';
import type { JSX } from 'react';

import { FilterBar } from '@/components/filter-bar';
import { ELEMENT_BG_COLORS } from '@/lib/element-styles';
import { getElementIconPath } from '@/lib/elements';
import { toggleInSet } from '@/lib/set';

import { SORT_FIELDS } from '../sort-fields';
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

export function CharacterFilters({
  filters,
  onChange,
  showOwnership = true,
  ...counts
}: CharacterFiltersProps): JSX.Element {
  function toggleElement(element: Element) {
    onChange({ ...filters, elements: toggleInSet(filters.elements, element) });
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
