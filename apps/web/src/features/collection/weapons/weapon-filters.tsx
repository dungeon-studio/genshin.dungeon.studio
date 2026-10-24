// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { WeaponType } from '@genshin/game-data';
import { WEAPON_TYPES } from '@genshin/game-data';
import type { JSX } from 'react';

import { CollectionToolbar } from '@/components/collection-toolbar';
import { toggleInSet } from '@/lib/toggle-in-set';
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
  collapsible?: boolean;
}

const WEAPON_TYPE_VALUES = Object.values(WEAPON_TYPES);

export function WeaponFilters({
  filters,
  onChange,
  showOwnership = true,
  showWeaponTypes = true,
  collapsible = false,
  ...counts
}: WeaponFiltersProps): JSX.Element {
  function toggleWeaponType(type: WeaponType) {
    onChange({ ...filters, weaponTypes: toggleInSet(filters.weaponTypes, type) });
  }

  return (
    <CollectionToolbar
      filters={filters}
      onChange={onChange}
      noun={{ one: 'weapon', other: 'weapons' }}
      searchLabel="Search weapons by name"
      showOwnership={showOwnership}
      collapsible={collapsible}
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
