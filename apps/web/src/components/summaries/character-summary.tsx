// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CircleHelp } from 'lucide-react';
import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';
import { getElementIconPath } from '@/lib/elements';
import { cn } from '@/lib/utils';

import { ItemSummary } from './item-summary';

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
      className={cn('h-10 w-10 shrink-0', dimmed && 'opacity-30')}
    />
  ) : (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-30">
      <CircleHelp className="h-5 w-5" aria-hidden="true" focusable={false} />
    </div>
  );

  return (
    <ItemSummary
      icon={icon}
      name={character?.name}
      rarity={character?.rarity}
      metadata={character && `${character.weaponType} · ${character.region}`}
      emptyLabel="No character"
    />
  );
}
