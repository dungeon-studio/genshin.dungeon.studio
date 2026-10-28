// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import type { JSX } from 'react';

import { ThemedIcon } from '@/components/icons/themed-icon';
import { cn } from '@/lib/class-names';
import { getElementIconPath } from '@/lib/elements';

import { EmptyItemIcon } from './empty-item-icon';
import { ICON_SLOT, ItemSummary } from './item-summary';

interface CharacterSummaryProps {
  character?: Character;
  dimmed?: boolean;
}

export function CharacterSummary({
  character,
  dimmed = false,
}: CharacterSummaryProps): JSX.Element {
  const icon = character ? (
    <ThemedIcon
      iconPath={(variant) => getElementIconPath(character.element, variant)}
      alt={character.element}
      loading="lazy"
      decoding="async"
      className={cn(ICON_SLOT, dimmed && 'opacity-30')}
    />
  ) : (
    <EmptyItemIcon shape="circle" />
  );

  return (
    <ItemSummary
      icon={icon}
      item={
        character && {
          name: character.name,
          rarity: character.rarity,
          metadata: `${character.weaponType} · ${character.region}`,
        }
      }
      emptyLabel="No character"
    />
  );
}
