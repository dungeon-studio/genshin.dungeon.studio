// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity, Weapon, WeaponType } from '@genshin/game-data';
import { compareVersions, WEAPON_TYPES } from '@genshin/game-data';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type OwnershipFilter = 'all' | 'owned' | 'unowned';
export type SortField = 'release' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface WeaponFilterState {
  search: string;
  weaponTypes: Set<WeaponType>;
  rarities: Set<Rarity>;
  ownership: OwnershipFilter;
  sortField: SortField;
  sortDirection: SortDirection;
}

interface WeaponFiltersProps {
  filters: WeaponFilterState;
  onChange: (filters: WeaponFilterState) => void;
  filteredCount: number;
  totalCount: number;
  ownedCount: number;
  filteredOwnedCount: number;
}

const WEAPON_TYPE_VALUES = Object.values(WEAPON_TYPES);
const RARITY_VALUES: Rarity[] = [5, 4];

const SORT_LABELS: Record<SortField, string> = {
  release: 'Release',
  name: 'Name',
};

export function filterWeapons(
  weapons: readonly Weapon[],
  filters: WeaponFilterState,
  ownedWeaponIds: Set<Weapon['id']>,
): Weapon[] {
  const searchLower = filters.search.toLowerCase();

  const result = weapons.filter((w) => {
    if (searchLower && !w.name.toLowerCase().includes(searchLower)) return false;
    if (filters.weaponTypes.size > 0 && !filters.weaponTypes.has(w.type)) return false;
    if (filters.rarities.size > 0 && !filters.rarities.has(w.rarity)) return false;
    if (filters.ownership === 'owned' && !ownedWeaponIds.has(w.id)) return false;
    if (filters.ownership === 'unowned' && ownedWeaponIds.has(w.id)) return false;
    return true;
  });

  result.sort((a, b) => {
    let cmp = 0;
    switch (filters.sortField) {
      case 'release':
        cmp = compareVersions(a.version, b.version);
        if (cmp === 0) {
          cmp = a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
        }
        break;
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
    }
    return filters.sortDirection === 'desc' ? -cmp : cmp;
  });

  return result;
}

export function WeaponFilters({
  filters,
  onChange,
  filteredCount,
  totalCount,
  ownedCount,
  filteredOwnedCount,
}: WeaponFiltersProps) {
  function toggleWeaponType(type: WeaponType) {
    const next = new Set(filters.weaponTypes);
    if (next.has(type)) {
      next.delete(type);
    } else {
      next.add(type);
    }
    onChange({ ...filters, weaponTypes: next });
  }

  function toggleRarity(rarity: Rarity) {
    const next = new Set(filters.rarities);
    if (next.has(rarity)) {
      next.delete(rarity);
    } else {
      next.add(rarity);
    }
    onChange({ ...filters, rarities: next });
  }

  function cycleSortField() {
    const fields: SortField[] = ['release', 'name'];
    const currentIndex = fields.indexOf(filters.sortField);
    const nextField = fields[(currentIndex + 1) % fields.length];
    onChange({ ...filters, sortField: nextField });
  }

  function toggleSortDirection() {
    onChange({
      ...filters,
      sortDirection: filters.sortDirection === 'asc' ? 'desc' : 'asc',
    });
  }

  return (
    <div className="space-y-1.5">
      {/* Row 1: Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {/* Ownership filters */}
        {(['all', 'owned', 'unowned'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange({ ...filters, ownership: value })}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors',
              filters.ownership === value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            aria-pressed={filters.ownership === value}
          >
            {value}
          </button>
        ))}

        <span className="self-center text-border" aria-hidden="true">
          |
        </span>

        {/* Rarity filters */}
        {RARITY_VALUES.map((rarity) => (
          <button
            key={rarity}
            type="button"
            onClick={() => toggleRarity(rarity)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              filters.rarities.has(rarity)
                ? 'bg-geo-dark text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            aria-pressed={filters.rarities.has(rarity)}
            aria-label={`Filter by ${rarity}-star`}
          >
            {rarity}★
          </button>
        ))}

        <span className="self-center text-border" aria-hidden="true">
          |
        </span>

        {/* Weapon type filters */}
        {WEAPON_TYPE_VALUES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleWeaponType(type)}
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
              filters.weaponTypes.has(type)
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
            aria-pressed={filters.weaponTypes.has(type)}
            aria-label={`Filter by ${type}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Row 2: Search + status + sort */}
      <div className="flex items-center gap-1.5">
        <div className="relative w-1/2 lg:w-1/3">
          <Search
            className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <Input
            type="search"
            placeholder="Search…"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-8 pl-9 text-xs [&::-webkit-search-cancel-button]:grayscale"
            aria-label="Search weapons by name"
          />
        </div>

        <div className="flex-1" />

        <p className="text-sm text-muted-foreground">
          {filteredCount === totalCount ? (
            <>
              {ownedCount} / {totalCount} owned
            </>
          ) : (
            <>
              {filteredOwnedCount} / {filteredCount} owned
            </>
          )}
        </p>

        <div className="flex shrink-0 items-center">
          <Button variant="outline" size="sm" onClick={cycleSortField} className="rounded-r-none">
            {SORT_LABELS[filters.sortField]}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSortDirection}
            aria-label={`Sort ${filters.sortDirection === 'asc' ? 'ascending' : 'descending'}`}
            className="-ml-px rounded-l-none px-1.5"
          >
            {filters.sortDirection === 'asc' ? (
              <ArrowUpNarrowWide className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
            ) : (
              <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
