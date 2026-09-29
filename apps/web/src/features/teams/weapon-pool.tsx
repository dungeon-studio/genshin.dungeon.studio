// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CollectionTeam,
  CollectionWeapon,
  CollectionWeaponId,
  TeamSlot,
} from '@genshin/domain';
import type { Weapon, WeaponType } from '@genshin/game-data';
import { getCharacterById, getWeaponById, WEAPON_ROSTER } from '@genshin/game-data';
import { Lock, Swords } from 'lucide-react';
import type { JSX } from 'react';
import { useId, useMemo, useState } from 'react';

import { WeaponSummary } from '@/components/summaries/weapon-summary';
import type { WeaponFilterState } from '@/features/collection/weapons/filtering';
import { filterWeapons, initialFilterState } from '@/features/collection/weapons/filtering';
import { weaponIdsOf } from '@/features/collection/weapons/use-weapon-collection-store';
import { WeaponFilters } from '@/features/collection/weapons/weapon-filters';
import { EmptyPool } from '@/features/teams/empty-pool';
import { useTeamStore } from '@/features/teams/use-team-store';
import { RARITY_BORDER_COLORS, RARITY_SELECTED_RINGS } from '@/lib/rarity-styles';
import { cn } from '@/lib/utils';

function buildEquippedWeapons(
  teams: Record<TeamSlot, CollectionTeam>,
): Map<CollectionWeaponId, string> {
  const map = new Map<CollectionWeaponId, string>();
  for (const team of Object.values(teams)) {
    for (const member of team.members) {
      if (member?.weaponInstanceId) {
        map.set(member.weaponInstanceId, member.characterId);
      }
    }
  }
  return map;
}

function weaponLock(
  equippedBy: string | undefined,
  currentCharacterId: string | undefined,
): WeaponLock | undefined {
  if (equippedBy === undefined || equippedBy === currentCharacterId) return undefined;
  return {
    holder: getCharacterById(equippedBy)?.name ?? 'another character',
    offersRoute: currentCharacterId === undefined,
  };
}

function poolFilterState(weaponType: WeaponType | undefined): WeaponFilterState {
  return {
    ...initialFilterState(),
    ownership: 'owned',
    weaponTypes: weaponType ? new Set([weaponType]) : new Set(),
  };
}

interface WeaponPoolProps {
  collectionWeapons: CollectionWeapon[];
  /** Undefined on a member with no character, where the whole owned pool is offered. */
  weaponType?: WeaponType;
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
}: WeaponPoolProps): JSX.Element {
  const teams = useTeamStore((s) => s.teams);
  const currentCharacterId = teams[slot].members[memberIndex]?.characterId;
  const equippedWeapons = useMemo(() => buildEquippedWeapons(teams), [teams]);
  const [filters, setFilters] = useState<WeaponFilterState>(() => poolFilterState(weaponType));

  function handleFilterChange(next: WeaponFilterState) {
    setFilters({ ...next, ownership: 'owned' });
  }

  const ownedWeaponIds = useMemo(() => weaponIdsOf(collectionWeapons), [collectionWeapons]);

  const ownedCount = ownedWeaponIds.size;

  const hasWeaponsOfType = useMemo(
    () => !weaponType || [...ownedWeaponIds].some((id) => getWeaponById(id)?.type === weaponType),
    [ownedWeaponIds, weaponType],
  );

  const { filteredWeapons, filteredOwnedCount } = useMemo(() => {
    if (ownedWeaponIds.size === 0 || !hasWeaponsOfType)
      return { filteredWeapons: [] as Weapon[], filteredOwnedCount: 0 };
    const filtered = filterWeapons(WEAPON_ROSTER, filters, ownedWeaponIds);
    return {
      filteredWeapons: filtered,
      filteredOwnedCount: filtered.filter((w) => ownedWeaponIds.has(w.id)).length,
    };
  }, [filters, ownedWeaponIds, hasWeaponsOfType]);

  const instancesByWeaponId = useMemo(
    () =>
      collectionWeapons.reduce(
        (map, cw) => map.set(cw.weaponId, [...(map.get(cw.weaponId) ?? []), cw]),
        new Map<string, CollectionWeapon[]>(),
      ),
    [collectionWeapons],
  );

  if (ownedCount === 0) return <EmptyWeaponPool />;
  if (weaponType && !hasWeaponsOfType) return <EmptyWeaponPool weaponType={weaponType} />;

  return (
    <div className="min-h-0 gap-3 flex flex-1 flex-col">
      <WeaponFilters
        filters={filters}
        onChange={handleFilterChange}
        filteredCount={filteredWeapons.length}
        totalCount={WEAPON_ROSTER.length}
        ownedCount={ownedCount}
        filteredOwnedCount={filteredOwnedCount}
        showOwnership={false}
        showWeaponTypes={weaponType === undefined}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid grid-cols-1">
          {filteredWeapons.flatMap((weapon) => {
            const instances = instancesByWeaponId.get(weapon.id) ?? [];
            return instances.map((instance) => {
              return (
                <PoolWeaponCard
                  key={instance.weaponInstanceId}
                  weapon={weapon}
                  refinementLevel={instance.refinementLevel}
                  selected={instance.weaponInstanceId === selectedCollectionWeaponId}
                  lock={weaponLock(
                    equippedWeapons.get(instance.weaponInstanceId),
                    currentCharacterId,
                  )}
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

/** Points at the weapons page, filtered to `weaponType` when the member needs one. */
function EmptyWeaponPool({ weaponType }: { weaponType?: WeaponType }): JSX.Element {
  const kind = weaponType ? `${weaponType} weapons` : 'weapons';
  return (
    <EmptyPool
      icon={Swords}
      heading={`No ${kind} in your collection`}
      body={`Visit the weapons page to add ${kind} to your collection.`}
      ctaLabel="Go to Weapons"
      to={weaponType ? `/weapons?type=${weaponType}` : '/weapons'}
    />
  );
}

interface WeaponLock {
  holder: string;
  /**
   * Only an empty member offers the character-first route. Picking the holder there
   * carries the weapon over; on a filled member it would replace the character.
   */
  offersRoute: boolean;
}

interface PoolWeaponCardProps {
  weapon: Weapon;
  refinementLevel: number;
  selected: boolean;
  lock?: WeaponLock;
  onClick: () => void;
}

function weaponCardLabel(weapon: Weapon, lock: WeaponLock | undefined, selected: boolean): string {
  if (lock) return `${weapon.name} is equipped by ${lock.holder}`;
  if (selected) return `Remove ${weapon.name} from character`;
  return `Assign ${weapon.name} to character`;
}

function PoolWeaponCard({ weapon, refinementLevel, selected, lock, onClick }: PoolWeaponCardProps) {
  const routeId = useId();
  const equipped = lock !== undefined;
  const route = lock?.offersRoute
    ? `Pick ${lock.holder} from Characters to bring it along.`
    : undefined;

  return (
    <button
      type="button"
      onClick={equipped ? undefined : onClick}
      disabled={equipped}
      className={cn(
        'gap-1 p-3 shadow-sm flex w-full flex-col rounded-lg border border-l-4 border-border bg-card text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        RARITY_BORDER_COLORS[weapon.rarity] ?? 'border-l-border',
        selected && `ring-2 ring-inset ${RARITY_SELECTED_RINGS[weapon.rarity] ?? 'ring-border'}`,
        equipped ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50',
      )}
      aria-label={weaponCardLabel(weapon, lock, selected)}
      aria-describedby={route ? routeId : undefined}
      aria-pressed={selected}
    >
      <span className={cn('gap-3 flex w-full items-center', equipped && 'opacity-40')}>
        <WeaponSummary weapon={weapon} dimmed={false} />
        {equipped && (
          <Lock
            className="shrink-0 text-destructive"
            size={14}
            aria-hidden="true"
            focusable={false}
          />
        )}
        <span className="px-2 py-0.5 text-xs font-bold shrink-0 rounded-full bg-muted text-muted-foreground tabular-nums">
          R{refinementLevel}
        </span>
      </span>
      {lock && (
        <span className="text-xs text-muted-foreground">
          Equipped by {lock.holder}.{route && <span id={routeId}> {route}</span>}
        </span>
      )}
    </button>
  );
}
