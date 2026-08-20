// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';
import { getElementIconPath } from '@/lib/elements';
import { cn } from '@/lib/utils';

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
      lightSrc={getElementIconPath(character.element, 'light')}
      darkSrc={getElementIconPath(character.element, 'dark')}
      alt={character.element}
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
