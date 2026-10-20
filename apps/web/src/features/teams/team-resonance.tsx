// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam } from '@genshin/domain';
import type { Element, ElementalResonance } from '@genshin/game-data';
import { getActiveResonances, getCharacterById, RESONANCE_TRIGGERS } from '@genshin/game-data';
import type { JSX } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ThemedIcon } from '@/components/ui/themed-icon';
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
    <ul className="gap-1.5 flex flex-wrap items-center" aria-label="Elemental resonance">
      {resonances.map((resonance) => {
        const icons = badgeElements(resonance, elements);
        const tint = icons.length === 1 ? icons[0] : undefined;

        return (
          <li key={resonance.id}>
            <Popover>
              <PopoverTrigger
                className={cn(
                  'gap-1.5 px-2.5 py-1 text-xs font-medium inline-flex items-center rounded-full',
                  tint ? ELEMENT_BG_COLORS[tint] : 'bg-muted text-muted-foreground',
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
              </PopoverTrigger>
              <PopoverContent className="text-sm" side="bottom" align="start">
                {resonance.description}
              </PopoverContent>
            </Popover>
          </li>
        );
      })}
    </ul>
  );
}
