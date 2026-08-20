// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { WeaponId, WeaponType } from '@genshin/game-data';
import { WEAPON_ROSTER, WEAPON_TYPES } from '@genshin/game-data';
import { Loader2 } from 'lucide-react';
import type { JSX } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Container } from '@/components/chrome/container';
import { signInWithGoogle } from '@/features/auth';
import type { WeaponFilterState } from '@/features/collection/weapons/filtering';
import { filterWeapons, initialFilterState } from '@/features/collection/weapons/filtering';
import { useWeaponCollection } from '@/features/collection/weapons/use-weapon-collection';
import { weaponIdsOf } from '@/features/collection/weapons/use-weapon-collection-store';
import { WeaponCard } from '@/features/collection/weapons/weapon-card';
import { WeaponFilters } from '@/features/collection/weapons/weapon-filters';
import { WeaponInstanceSidebar } from '@/features/collection/weapons/weapon-instance-sidebar';

/** The toast asks the user to act, not just to read. */
const AUTH_TOAST_DURATION_MS = 10_000;

function promptSignIn() {
  toast.info('Sign in to manage your weapon collection.', {
    action: { label: 'Sign in', onClick: () => void signInWithGoogle() },
    duration: AUTH_TOAST_DURATION_MS,
  });
}

export function WeaponsPage(): JSX.Element {
  const {
    weapons,
    isAuthenticated,
    ensureWeapon,
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
  const [selectedWeaponId, setSelectedWeaponId] = useState<WeaponId | null>(null);

  const effectiveSelectedWeaponId = isAuthenticated ? selectedWeaponId : null;

  const ownedWeaponIds = useMemo(() => weaponIdsOf(Object.values(weapons)), [weapons]);

  // Count instances per weaponId for badges
  const instanceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const instance of Object.values(weapons)) {
      counts[instance.weaponId] = (counts[instance.weaponId] ?? 0) + 1;
    }
    return counts;
  }, [weapons]);

  const { filteredWeapons, filteredOwnedCount } = useMemo(() => {
    const filtered = filterWeapons(WEAPON_ROSTER, filters, ownedWeaponIds);
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
    (weaponId: WeaponId) => {
      if (selectedWeaponId === weaponId) {
        setSelectedWeaponId(null);
        return;
      }

      if (!isAuthenticated) {
        promptSignIn();
        return;
      }

      ensureWeapon(weaponId);
      setSelectedWeaponId(weaponId);
    },
    [selectedWeaponId, isAuthenticated, ensureWeapon],
  );

  const handleAddWeapon = useCallback(
    (weaponId: WeaponId) => {
      addWeapon(weaponId);
    },
    [addWeapon],
  );

  if (isLoading) {
    return (
      <Container className="py-12">
        <h1 className="sr-only">Weapons</h1>
        <div className="py-24 flex items-center justify-center">
          <Loader2
            className="h-8 w-8 animate-spin text-muted-foreground"
            aria-hidden="true"
            focusable={false}
          />
          <span className="sr-only">Loading collection</span>
        </div>
      </Container>
    );
  }

  return (
    <>
      <h1 className="sr-only">Weapons</h1>

      <div className="top-0 shadow-sm sticky z-10 bg-background">
        <Container className="py-4">
          {error && (
            <p className="mb-3 px-4 py-3 text-sm rounded-md bg-destructive/10 text-center text-destructive">
              Failed to sync weapon collection.
            </p>
          )}
          <WeaponFilters
            filters={filters}
            onChange={setFilters}
            filteredCount={filteredWeapons.length}
            totalCount={WEAPON_ROSTER.length}
            ownedCount={ownedWeaponIds.size}
            filteredOwnedCount={filteredOwnedCount}
            collapsible
          />
        </Container>
      </div>

      <Container className="pb-12 pt-4">
        <div className="gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 grid grid-cols-1">
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
      </Container>

      <WeaponInstanceSidebar
        weaponId={effectiveSelectedWeaponId}
        instances={selectedInstances}
        onClose={() => setSelectedWeaponId(null)}
        onAdd={handleAddWeapon}
        onRemove={removeWeapon}
        onRefinementChange={setRefinementLevel}
      />
    </>
  );
}
