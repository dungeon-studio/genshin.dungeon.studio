// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam } from '@genshin/domain';
import type { Element, ElementalResonance } from '@genshin/game-data';
import { getActiveResonances, getCharacterById, RESONANCE_TRIGGERS } from '@genshin/game-data';
import type { JSX } from 'react';

import { ThemedIcon } from '@/components/ui/themed-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ELEMENT_BG_COLORS } from '@/lib/element-styles';
import { getElementIconPath } from '@/lib/elements';
import { cn } from '@/lib/utils';

interface TeamResonanceProps {
  members: CollectionTeam['members'];
}

/** Protective Canopy is the whole party's doing, so it wears the party's elements. */
function badgeElements(resonance: ElementalResonance, teamElements: Element[]): Element[] {
  return resonance.condition.trigger === RESONANCE_TRIGGERS.PAIR
    ? [resonance.condition.element]
    : [...new Set(teamElements)];
}

export function TeamResonance({ members }: TeamResonanceProps): JSX.Element | null {
  const elements = members
    .filter((member) => member !== null)
    .map((member) => getCharacterById(member.characterId)?.element)
    .filter((element) => element !== undefined);

  const resonances = getActiveResonances(elements);
  if (resonances.length === 0) return null;

  return (
    <TooltipProvider>
      <ul className="flex flex-wrap items-center gap-1.5">
        {resonances.map((resonance) => {
          const icons = badgeElements(resonance, elements);

          return (
            <li key={resonance.name}>
              <Tooltip>
                <TooltipTrigger
                  className={cn(
                    'inline-flex cursor-help items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    icons.length === 1
                      ? ELEMENT_BG_COLORS[icons[0]]
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  {icons.map((element) => (
                    <ThemedIcon
                      key={element}
                      lightSrc={getElementIconPath(element, 'light')}
                      darkSrc={getElementIconPath(element, 'dark')}
                      alt=""
                      className="h-3.5 w-3.5"
                    />
                  ))}
                  {resonance.name}
                </TooltipTrigger>
                <TooltipContent>{resonance.description}</TooltipContent>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    </TooltipProvider>
  );
}
