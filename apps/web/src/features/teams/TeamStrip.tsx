// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Team } from '@genshin/domain';
import { MAX_TEAM_MEMBERS } from '@genshin/domain';
import { getCharacterById } from '@genshin/game-data';
import { UserRound } from 'lucide-react';

import { getElementIconPath } from '@/lib/elements';
import { ELEMENT_BORDER_ALL_COLORS } from '@/lib/elementStyles';
import { cn } from '@/lib/utils';

interface TeamStripProps {
  members: Team['members'];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function TeamStrip({ members, selectedIndex, onSelect }: TeamStripProps) {
  const slots = Array.from({ length: MAX_TEAM_MEMBERS }, (_, i) => members[i]);

  return (
    <div className="flex items-center justify-center gap-3 border-b border-border py-3 sm:hidden">
      {slots.map((member, i) => {
        const character = member ? getCharacterById(member.characterId) : undefined;

        const selected = selectedIndex === i;
        const borderClass =
          selected && character
            ? ELEMENT_BORDER_ALL_COLORS[character.element]
            : selected
              ? 'border-primary'
              : 'border-transparent';

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelect(i)}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted border-2 transition-colors',
              borderClass,
            )}
            aria-label={character ? `Select ${character.name}` : `Select empty slot ${i + 1}`}
            aria-pressed={selectedIndex === i}
          >
            {character ? (
              <img
                src={getElementIconPath(character.element)}
                alt={character.element}
                className="h-6 w-6"
              />
            ) : (
              <UserRound
                className="h-5 w-5 text-muted-foreground/40"
                aria-hidden="true"
                focusable={false}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
