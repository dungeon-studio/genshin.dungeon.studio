// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { WEAPONS } from '@genshin/game-data';
import { Loader2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import type { WeaponType } from '@genshin/game-data';
import { WEAPON_TYPES } from '@genshin/game-data';

import type { WeaponFilterState } from '@/features/collection/weapons/filtering';
import { filterWeapons, initialFilterState } from '@/features/collection/weapons/filtering';
import { useWeaponCollection } from '@/features/collection/weapons/useWeaponCollection';
import { WeaponCard } from '@/features/collection/weapons/WeaponCard';
import { WeaponFilters } from '@/features/collection/weapons/WeaponFilters';
import { WeaponInstanceSidebar } from '@/features/collection/weapons/WeaponInstanceSidebar';

export function WeaponsPage() {
  const {
    weapons,
    isAuthenticated,
    addWeapon,
    removeWeapon,
    setRefinementLevel,
    getWeaponsByWeaponId,
    isLoading,
    error,
  } = useWeaponCollection();

  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<WeaponFilterState>(() => {
    const state = initialFilterState();
    const typeParam = searchParams.get('type');
    const weaponTypeValues = Object.values(WEAPON_TYPES) as WeaponType[];
    if (typeParam && weaponTypeValues.includes(typeParam as WeaponType)) {
      state.weaponTypes = new Set<WeaponType>([typeParam as WeaponType]);
    }
    return state;
  });
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);

  const effectiveSelectedWeaponId = isAuthenticated ? selectedWeaponId : null;

  // Collect weapon IDs that have at least one instance
  const ownedWeaponIds = useMemo(() => {
    const ids = new Set<string>();
    for (const instance of Object.values(weapons)) {
      ids.add(instance.weaponId);
    }
    return ids;
  }, [weapons]);

  // Count instances per weaponId for badges
  const instanceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const instance of Object.values(weapons)) {
      counts[instance.weaponId] = (counts[instance.weaponId] ?? 0) + 1;
    }
    return counts;
  }, [weapons]);

  const { filteredWeapons, filteredOwnedCount } = useMemo(() => {
    const filtered = filterWeapons(WEAPONS, filters, ownedWeaponIds);
    return {
      filteredWeapons: filtered,
      filteredOwnedCount: filtered.filter((w) => ownedWeaponIds.has(w.id)).length,
    };
  }, [filters, ownedWeaponIds]);

  const selectedInstances = useMemo(
    () => (effectiveSelectedWeaponId ? getWeaponsByWeaponId(effectiveSelectedWeaponId) : []),
    [effectiveSelectedWeaponId, getWeaponsByWeaponId],
  );

  const handleWeaponClick = useCallback(
    (weaponId: string) => {
      if (selectedWeaponId === weaponId) {
        setSelectedWeaponId(null);
        return;
      }

      if (!isAuthenticated) {
        toast.info('Sign in to manage your weapon collection.');
        return;
      }

      const hasInstances = (instanceCounts[weaponId] ?? 0) > 0;
      if (!hasInstances) {
        addWeapon(weaponId);
      }

      setSelectedWeaponId(weaponId);
    },
    [selectedWeaponId, isAuthenticated, instanceCounts, addWeapon],
  );

  const handleAddWeapon = useCallback(
    (weaponId: string) => {
      addWeapon(weaponId);
    },
    [addWeapon],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="sr-only">Weapons</h1>
        <div className="flex items-center justify-center py-24">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <span className="sr-only">Loading collection</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="sr-only">Weapons</h1>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
          Failed to sync weapon collection.
        </p>
      )}

      <WeaponFilters
        filters={filters}
        onChange={setFilters}
        filteredCount={filteredWeapons.length}
        totalCount={WEAPONS.length}
        ownedCount={ownedWeaponIds.size}
        filteredOwnedCount={filteredOwnedCount}
      />

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredWeapons.map((weapon) => (
          <WeaponCard
            key={weapon.id}
            weapon={weapon}
            instanceCount={instanceCounts[weapon.id] ?? 0}
            selected={effectiveSelectedWeaponId === weapon.id}
            onClick={handleWeaponClick}
          />
        ))}
      </div>

      {filteredWeapons.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">No weapons match your filters.</p>
      )}

      <WeaponInstanceSidebar
        weaponId={effectiveSelectedWeaponId}
        instances={selectedInstances}
        onClose={() => setSelectedWeaponId(null)}
        onAdd={handleAddWeapon}
        onRemove={removeWeapon}
        onRefinementChange={setRefinementLevel}
      />
    </div>
  );
}
