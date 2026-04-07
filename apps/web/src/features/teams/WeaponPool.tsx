// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import type { Weapon, WeaponType } from '@genshin/game-data';
import { WEAPONS } from '@genshin/game-data';
import { useMemo, useState } from 'react';

import { WeaponSummary } from '@/components/WeaponSummary';
import type { WeaponFilterState } from '@/features/collection/weapons/filtering';
import { filterWeapons, initialFilterState } from '@/features/collection/weapons/filtering';
import { WeaponFilters } from '@/features/collection/weapons/WeaponFilters';
import { RARITY_BORDER_COLORS } from '@/lib/rarityStyles';
import { cn } from '@/lib/utils';

function poolFilterState(weaponType: WeaponType): WeaponFilterState {
  return { ...initialFilterState(), ownership: 'owned', weaponTypes: new Set([weaponType]) };
}

interface WeaponPoolProps {
  collectionWeapons: CollectionWeapon[];
  weaponType: WeaponType;
  selectedCollectionWeaponId?: CollectionWeaponId;
  onSelect: (collectionWeaponId: CollectionWeaponId) => void;
  onClear: () => void;
}

export function WeaponPool({
  collectionWeapons,
  weaponType,
  selectedCollectionWeaponId,
  onSelect,
  onClear,
}: WeaponPoolProps) {
  const [filters, setFilters] = useState<WeaponFilterState>(() => poolFilterState(weaponType));

  function handleFilterChange(next: WeaponFilterState) {
    setFilters({ ...next, ownership: 'owned' });
  }

  const ownedWeaponIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cw of collectionWeapons) {
      ids.add(cw.weaponId);
    }
    return ids;
  }, [collectionWeapons]);

  const ownedCount = ownedWeaponIds.size;

  const { filteredWeapons, filteredOwnedCount } = useMemo(() => {
    const filtered = filterWeapons(WEAPONS, filters, ownedWeaponIds);
    return {
      filteredWeapons: filtered,
      filteredOwnedCount: filtered.filter((w) => ownedWeaponIds.has(w.id)).length,
    };
  }, [filters, ownedWeaponIds]);

  const instancesByWeaponId = useMemo(() => {
    const map = new Map<string, CollectionWeapon[]>();
    for (const cw of collectionWeapons) {
      const list = map.get(cw.weaponId) ?? [];
      list.push(cw);
      map.set(cw.weaponId, list);
    }
    return map;
  }, [collectionWeapons]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <WeaponFilters
        filters={filters}
        onChange={handleFilterChange}
        filteredCount={filteredWeapons.length}
        totalCount={WEAPONS.length}
        ownedCount={ownedCount}
        filteredOwnedCount={filteredOwnedCount}
        showOwnership={false}
        showWeaponTypes={false}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredWeapons.flatMap((weapon) => {
            const instances = instancesByWeaponId.get(weapon.id) ?? [];
            return instances.map((instance) => (
              <PoolWeaponCard
                key={instance.weaponInstanceId}
                weapon={weapon}
                refinementLevel={instance.refinementLevel}
                selected={instance.weaponInstanceId === selectedCollectionWeaponId}
                onClick={() => {
                  if (instance.weaponInstanceId === selectedCollectionWeaponId) {
                    onClear();
                  } else {
                    onSelect(instance.weaponInstanceId);
                  }
                }}
              />
            ));
          })}
        </div>

        {filteredWeapons.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">No weapons match your filters.</p>
        )}
      </div>
    </div>
  );
}

interface PoolWeaponCardProps {
  weapon: Weapon;
  refinementLevel: number;
  selected: boolean;
  onClick: () => void;
}

function PoolWeaponCard({ weapon, refinementLevel, selected, onClick }: PoolWeaponCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors',
        selected ? (RARITY_BORDER_COLORS[weapon.rarity] ?? 'border-l-border') : 'border-l-border',
        'cursor-pointer hover:bg-accent/50',
      )}
      aria-label={selected ? `Remove ${weapon.name} from team` : `Assign ${weapon.name} to team`}
      aria-pressed={selected}
    >
      <WeaponSummary weapon={weapon} dimmed={!selected} />
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">
        R{refinementLevel}
      </span>
    </button>
  );
}
