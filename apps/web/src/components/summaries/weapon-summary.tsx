// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Weapon, WeaponType } from '@genshin/game-data';
import { CircleHelp } from 'lucide-react';
import type { JSX } from 'react';

import { ItemSummary } from '@/components/item-summary';
import { ThemedIcon } from '@/components/themed-icon';
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
  const dimIcon = !weapon || dimmed;

  const icon = iconType ? (
    <ThemedIcon
      lightSrc={getWeaponTypeIconPath(iconType, 'light')}
      darkSrc={getWeaponTypeIconPath(iconType, 'dark')}
      alt=""
      className={cn('h-10 w-10 shrink-0', dimIcon && 'opacity-30')}
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground opacity-30">
      <CircleHelp className="h-5 w-5" aria-hidden="true" focusable={false} />
    </div>
  );

  return (
    <ItemSummary
      icon={icon}
      name={weapon?.name}
      rarity={weapon?.rarity}
      metadata={weapon?.type}
      emptyLabel="No weapon"
    />
  );
}
