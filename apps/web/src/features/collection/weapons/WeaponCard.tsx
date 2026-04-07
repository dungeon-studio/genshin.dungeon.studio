// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon } from '@genshin/game-data';

import { WeaponSummary } from '@/components/WeaponSummary';
import { RARITY_BORDER_COLORS } from '@/lib/rarityStyles';
import { cn } from '@/lib/utils';

interface WeaponCardProps {
  weapon: Weapon;
  instanceCount: number;
  selected?: boolean;
  onClick?: (weaponId: Weapon['id']) => void;
}

export function WeaponCard({ weapon, instanceCount, selected = false, onClick }: WeaponCardProps) {
  const owned = instanceCount > 0;

  return (
    <button
      type="button"
      onClick={() => onClick?.(weapon.id)}
      className={cn(
        'relative flex w-full items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors',
        owned ? (RARITY_BORDER_COLORS[weapon.rarity] ?? 'border-l-border') : 'border-l-border',
        selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
        'cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
      aria-label={`${weapon.name}, ${instanceCount} owned`}
    >
      <WeaponSummary weapon={weapon} dimmed={!owned} />

      {owned && (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground">
          ×{instanceCount}
        </span>
      )}
    </button>
  );
}
