// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';
import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';
import type { BaseFilterState } from '@/lib/collection-filters';
import { toggleInSet } from '@/lib/toggle-in-set';

import { Chip } from './chip';
import type { FilterCategoryConfig } from './types';

const RARITY_VALUES: Rarity[] = [5, 4];

interface FilterChipsProps<F extends BaseFilterState, T extends string> {
  filters: F;
  onChange: (filters: F) => void;
  category: FilterCategoryConfig<T>;
  showCategory: boolean;
  showOwnership: boolean;
}

export function FilterChips<F extends BaseFilterState, T extends string>({
  filters,
  onChange,
  category,
  showCategory,
  showOwnership,
}: FilterChipsProps<F, T>): JSX.Element {
  function toggleRarity(rarity: Rarity) {
    onChange({ ...filters, rarities: toggleInSet(filters.rarities, rarity) });
  }

  return (
    <div className="gap-1.5 flex flex-wrap items-center">
      {showOwnership &&
        (['all', 'owned', 'unowned'] as const).map((value) => (
          <Chip
            key={value}
            pressed={filters.ownership === value}
            onClick={() => onChange({ ...filters, ownership: value })}
            className="capitalize"
            pressedClassName="bg-foreground text-background"
          >
            {value}
          </Chip>
        ))}

      {showOwnership && <ChipDivider />}

      {RARITY_VALUES.map((rarity) => (
        <Chip
          key={rarity}
          pressed={filters.rarities.has(rarity)}
          onClick={() => toggleRarity(rarity)}
          pressedClassName="text-white bg-geo-dark"
          label={`Filter by ${rarity}-star`}
        >
          {rarity}★
        </Chip>
      ))}

      {showCategory && <ChipDivider />}

      {showCategory &&
        category.values.map((value) => (
          <Chip
            key={value}
            pressed={category.selected.has(value)}
            onClick={() => category.onToggle(value)}
            className="gap-1.5 inline-flex items-center"
            pressedClassName={category.activeClassName(value)}
            label={`Filter by ${value}`}
          >
            <ThemedIcon
              lightSrc={category.iconPath(value, 'light')}
              darkSrc={category.iconPath(value, 'dark')}
              alt=""
              className="h-3.5 w-3.5"
            />
            {value}
          </Chip>
        ))}
    </div>
  );
}

function ChipDivider(): JSX.Element {
  return (
    <span className="self-center text-border" aria-hidden="true">
      |
    </span>
  );
}
