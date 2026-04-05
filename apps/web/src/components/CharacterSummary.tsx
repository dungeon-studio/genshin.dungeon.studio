// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character } from '@genshin/game-data';
import { CircleHelp } from 'lucide-react';

import { getElementIconPath } from '@/lib/elements';
import { cn } from '@/lib/utils';

interface CharacterSummaryProps {
  character?: Character;
  dimmed?: boolean;
}

export function CharacterSummary({ character, dimmed = false }: CharacterSummaryProps) {
  if (!character) {
    return (
      <>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground opacity-30">
          <CircleHelp className="h-5 w-5" aria-hidden="true" focusable={false} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-muted-foreground">No character</p>
        </div>
      </>
    );
  }

  const elementIconSrc = getElementIconPath(character.element);

  return (
    <>
      <img
        src={elementIconSrc}
        alt={character.element}
        loading="lazy"
        decoding="async"
        className={cn('h-10 w-10 shrink-0', dimmed && 'opacity-30')}
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-card-foreground">{character.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          <span className="text-geo-dark" aria-hidden="true">
            {character.rarity}★
          </span>
          <span className="sr-only">{character.rarity}-star</span>
          {` · ${character.weaponType} · ${character.region}`}
        </p>
      </div>
    </>
  );
}
