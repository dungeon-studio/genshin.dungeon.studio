// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { WeaponType } from '@genshin/game-data';
import { WEAPON_TYPES } from '@genshin/game-data';
import type { JSX } from 'react';

import { FilterBar } from '@/components/filter-bar';
import { getWeaponTypeIconPath } from '@/lib/weapon-types';

import type { WeaponFilterState } from './filtering';

interface WeaponFiltersProps {
  filters: WeaponFilterState;
  onChange: (filters: WeaponFilterState) => void;
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  filteredOwnedCount: number;
  showOwnership?: boolean;
  showWeaponTypes?: boolean;
}

const WEAPON_TYPE_VALUES = Object.values(WEAPON_TYPES);

const SORT_FIELDS = [
  { value: 'release', label: 'Release' },
  { value: 'name', label: 'Name' },
] as const;

export function WeaponFilters({
  filters,
  onChange,
  showOwnership = true,
  showWeaponTypes = true,
  ...counts
}: WeaponFiltersProps): JSX.Element {
  function toggleWeaponType(type: WeaponType) {
    const next = new Set(filters.weaponTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ ...filters, weaponTypes: next });
  }

  return (
    <FilterBar
      filters={filters}
      onChange={onChange}
      sortFields={SORT_FIELDS}
      noun="weapons"
      searchLabel="Search weapons by name"
      showOwnership={showOwnership}
      category={{
        values: WEAPON_TYPE_VALUES,
        selected: filters.weaponTypes,
        onToggle: toggleWeaponType,
        activeClassName: () => 'bg-foreground text-background',
        iconPath: getWeaponTypeIconPath,
        show: showWeaponTypes,
      }}
      {...counts}
    />
  );
}
