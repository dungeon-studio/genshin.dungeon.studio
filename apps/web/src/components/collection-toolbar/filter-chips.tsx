// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';
import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';
import type { BaseFilterState } from '@/lib/collection-filters';
import { toggleInSet } from '@/lib/toggle-in-set';
import { cn } from '@/lib/utils';

import type { FilterCategoryConfig } from './types';

const RARITY_VALUES: Rarity[] = [5, 4];

const CHIP = 'rounded-full px-2.5 py-1 text-xs font-medium transition-colors';
const CHIP_IDLE = 'bg-muted text-muted-foreground hover:bg-muted/80';

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
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...filters, ownership: value })}
            className={cn(
              CHIP,
              'capitalize',
              filters.ownership === value ? 'bg-foreground text-background' : CHIP_IDLE,
            )}
            aria-pressed={filters.ownership === value}
          >
            {value}
          </button>
        ))}

      {showOwnership && <ChipDivider />}

      {RARITY_VALUES.map((rarity) => (
        <button
          key={rarity}
          type="button"
          onClick={() => toggleRarity(rarity)}
          className={cn(CHIP, filters.rarities.has(rarity) ? 'text-white bg-geo-dark' : CHIP_IDLE)}
          aria-pressed={filters.rarities.has(rarity)}
          aria-label={`Filter by ${rarity}-star`}
        >
          {rarity}★
        </button>
      ))}

      {showCategory && <ChipDivider />}

      {showCategory &&
        category.values.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => category.onToggle(value)}
            className={cn(
              CHIP,
              'gap-1.5 inline-flex items-center',
              category.selected.has(value) ? category.activeClassName(value) : CHIP_IDLE,
            )}
            aria-pressed={category.selected.has(value)}
            aria-label={`Filter by ${value}`}
          >
            <ThemedIcon
              lightSrc={category.iconPath(value, 'light')}
              darkSrc={category.iconPath(value, 'dark')}
              alt=""
              className="h-3.5 w-3.5"
            />
            {value}
          </button>
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
