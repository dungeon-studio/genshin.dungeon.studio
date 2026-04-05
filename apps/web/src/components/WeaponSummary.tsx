// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';
import { CircleHelp } from 'lucide-react';

import { cn } from '@/lib/utils';

interface WeaponSummaryProps {
  /** Static weapon definition (name, rarity, type), not a collection instance. */
  weapon?: Weapon;
  dimmed?: boolean;
}

/**
 * Presentational fragment for weapon type info (name, rarity, weapon type).
 * Instance-level details like refinement are composed by the parent.
 */
export function WeaponSummary({ weapon, dimmed = false }: WeaponSummaryProps) {
  if (!weapon) {
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
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground',
          dimmed && 'opacity-30',
        )}
      >
        {weapon.type.slice(0, 3)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-card-foreground">{weapon.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          <span className="text-geo-dark" aria-hidden="true">
            {weapon.rarity}★
          </span>
          <span className="sr-only">{weapon.rarity}-star</span>
          {` · ${weapon.type}`}
        </p>
      </div>
    </>
  );
}
