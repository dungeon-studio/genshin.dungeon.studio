// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon, WeaponType } from '@genshin/game-data';
import { CircleHelp } from 'lucide-react';
import type { JSX } from 'react';

import { cn } from '@/lib/utils';
import { getWeaponTypeIconPath } from '@/lib/weapon-types';

interface WeaponSummaryProps {
  /** Static weapon definition (name, rarity, type), not a collection instance. */
  weapon?: Weapon;
  /** Weapon type of the character occupying this slot (used for the icon when no weapon is assigned). */
  weaponType?: WeaponType;
  dimmed?: boolean;
}

/**
 * Presentational fragment for weapon type info (name, rarity, weapon type).
 * Instance-level details like refinement are composed by the parent.
 */
export function WeaponSummary({
  weapon,
  weaponType,
  dimmed = false,
}: WeaponSummaryProps): JSX.Element {
  const iconType = weapon?.type ?? weaponType;

  if (!iconType) {
    return (
      <>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground opacity-30">
          <CircleHelp className="h-5 w-5" aria-hidden="true" focusable={false} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-muted-foreground">No weapon</p>
        </div>
      </>
    );
  }

  return (
    <>
      <img
        src={getWeaponTypeIconPath(iconType, 'light')}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={cn(
          'h-10 w-10 shrink-0 dark:hidden',
          !weapon && 'opacity-30',
          dimmed && 'opacity-30',
        )}
      />
      <img
        src={getWeaponTypeIconPath(iconType, 'dark')}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className={cn(
          'hidden h-10 w-10 shrink-0 dark:block',
          !weapon && 'opacity-30',
          dimmed && 'opacity-30',
        )}
      />

      <div className="min-w-0 flex-1">
        {weapon ? (
          <>
            <p className="truncate text-sm font-semibold text-card-foreground">{weapon.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              <span className="text-geo-dark" aria-hidden="true">
                {weapon.rarity}★
              </span>
              <span className="sr-only">{weapon.rarity}-star</span>
              {` · ${weapon.type}`}
            </p>
          </>
        ) : (
          <p className="truncate text-sm font-semibold text-muted-foreground">No weapon</p>
        )}
      </div>
    </>
  );
}
