// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';
import type { JSX } from 'react';

import { WeaponSummary } from '@/components/summaries/weapon-summary';
import { RARITY_BORDER_COLORS } from '@/lib/rarity-styles';
import { cn } from '@/lib/utils';

interface WeaponCardProps {
  weapon: Weapon;
  instanceCount: number;
  selected?: boolean;
  onClick?: (weaponId: Weapon['id']) => void;
}

export function WeaponCard({
  weapon,
  instanceCount,
  selected = false,
  onClick,
}: WeaponCardProps): JSX.Element {
  const owned = instanceCount > 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(weapon.id)}
      className={cn(
        'gap-3 p-3 shadow-sm relative flex w-full items-center rounded-lg border border-l-4 border-border bg-card text-left transition-colors',
        owned ? (RARITY_BORDER_COLORS[weapon.rarity] ?? 'border-l-border') : 'border-l-border',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        'cursor-pointer hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
      )}
      aria-label={`${weapon.name}, ${instanceCount} owned`}
    >
      <WeaponSummary weapon={weapon} dimmed={!owned} />

      {owned && (
        <span className="px-2 py-0.5 text-xs font-bold shrink-0 rounded-full bg-muted text-muted-foreground tabular-nums">
          ×{instanceCount}
        </span>
      )}
    </button>
  );
}
