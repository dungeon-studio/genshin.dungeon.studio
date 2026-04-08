// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon, CollectionWeaponId, Team, TeamSlot } from '@genshin/domain';
import { TEAM_SLOTS } from '@genshin/domain';
import type { Weapon, WeaponType } from '@genshin/game-data';
import { WEAPONS } from '@genshin/game-data';
import { Lock } from 'lucide-react';
import { useMemo, useState } from 'react';

import { WeaponSummary } from '@/components/WeaponSummary';
import type { WeaponFilterState } from '@/features/collection/weapons/filtering';
import { filterWeapons, initialFilterState } from '@/features/collection/weapons/filtering';
import { WeaponFilters } from '@/features/collection/weapons/WeaponFilters';
import { useTeamStore } from '@/features/teams/useTeamStore';
import { RARITY_BORDER_COLORS } from '@/lib/rarityStyles';
import { cn } from '@/lib/utils';

function buildEquippedWeapons(teams: Record<TeamSlot, Team>): Map<CollectionWeaponId, string> {
  const map = new Map<CollectionWeaponId, string>();
  for (const slot of TEAM_SLOTS) {
    for (const m of teams[slot].members) {
      if (m?.weaponInstanceId) {
        map.set(m.weaponInstanceId, m.characterId);
      }
    }
  }
  return map;
}

function poolFilterState(weaponType: WeaponType): WeaponFilterState {
  return { ...initialFilterState(), ownership: 'owned', weaponTypes: new Set([weaponType]) };
}

interface WeaponPoolProps {
  collectionWeapons: CollectionWeapon[];
  weaponType: WeaponType;
  selectedCollectionWeaponId?: CollectionWeaponId;
  slot: TeamSlot;
  memberIndex: number;
  onSelect: (collectionWeaponId: CollectionWeaponId) => void;
  onClear: () => void;
}

export function WeaponPool({
  collectionWeapons,
  weaponType,
  selectedCollectionWeaponId,
  slot,
  memberIndex,
  onSelect,
  onClear,
}: WeaponPoolProps) {
  const teams = useTeamStore((s) => s.teams);
  const currentCharacterId = teams[slot].members[memberIndex]?.characterId;
  const equippedWeapons = useMemo(() => buildEquippedWeapons(teams), [teams]);
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
            return instances.map((instance) => {
              const equippedBy = equippedWeapons.get(instance.weaponInstanceId);
              const equippedByOther = equippedBy !== undefined && equippedBy !== currentCharacterId;
              return (
                <PoolWeaponCard
                  key={instance.weaponInstanceId}
                  weapon={weapon}
                  refinementLevel={instance.refinementLevel}
                  selected={instance.weaponInstanceId === selectedCollectionWeaponId}
                  equipped={equippedByOther}
                  onClick={() => {
                    if (instance.weaponInstanceId === selectedCollectionWeaponId) {
                      onClear();
                    } else {
                      onSelect(instance.weaponInstanceId);
                    }
                  }}
                />
              );
            });
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
  equipped: boolean;
  onClick: () => void;
}

function weaponCardLabel(weapon: Weapon, equipped: boolean, selected: boolean): string {
  if (equipped) return `${weapon.name} is equipped by another character`;
  if (selected) return `Remove ${weapon.name} from character`;
  return `Assign ${weapon.name} to character`;
}

function PoolWeaponCard({
  weapon,
  refinementLevel,
  selected,
  equipped,
  onClick,
}: PoolWeaponCardProps) {
  return (
    <button
      type="button"
      onClick={equipped ? undefined : onClick}
      disabled={equipped}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors',
        selected ? (RARITY_BORDER_COLORS[weapon.rarity] ?? 'border-l-border') : 'border-l-border',
        equipped ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-accent/50',
      )}
      aria-label={weaponCardLabel(weapon, equipped, selected)}
      aria-pressed={selected}
    >
      <WeaponSummary weapon={weapon} dimmed={!selected || equipped} />
      {equipped && (
        <Lock
          className="shrink-0 text-destructive"
          size={14}
          aria-hidden="true"
          focusable={false}
        />
      )}
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">
        R{refinementLevel}
      </span>
    </button>
  );
}
