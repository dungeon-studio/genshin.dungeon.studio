// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam } from '@genshin/domain';
import type { Element, ElementalResonance } from '@genshin/game-data';
import { getActiveResonances, getCharacterById, RESONANCE_TRIGGERS } from '@genshin/game-data';
import type { JSX } from 'react';

import { ChipIcon } from '@/components/ui/chip-icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/class-names';
import { ELEMENT_BG_COLORS } from '@/lib/element-styles';
import { getElementIconPath } from '@/lib/elements';

interface TeamResonanceProps {
  members: CollectionTeam['members'];
}

interface BadgeAppearance {
  tint?: Element;
  elements: Element[];
}

function partyElements(members: CollectionTeam['members']): Element[] {
  return members
    .filter((member) => member !== null)
    .map((member) => getCharacterById(member.characterId)?.element)
    .filter((element) => element !== undefined);
}

/**
 * A pair resonance shows its element on that element's fill. Protective Canopy
 * shows every party element on a neutral badge.
 */
function badgeAppearance(resonance: ElementalResonance, party: Element[]): BadgeAppearance {
  const { condition } = resonance;

  return condition.trigger === RESONANCE_TRIGGERS.PAIR
    ? { tint: condition.element, elements: [condition.element] }
    : { elements: [...new Set(party)] };
}

function ResonanceBadge({
  resonance,
  party,
}: {
  resonance: ElementalResonance;
  party: Element[];
}): JSX.Element {
  const { tint, elements } = badgeAppearance(resonance, party);

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          'gap-1.5 px-2.5 py-1 text-xs font-medium inline-flex items-center rounded-full',
          tint ? ELEMENT_BG_COLORS[tint] : 'bg-muted text-muted-foreground',
        )}
      >
        {elements.map((element) => (
          <ChipIcon
            key={element}
            iconPath={(variant) => getElementIconPath(element, variant)}
            onFill={tint !== undefined}
          />
        ))}
        {resonance.name}
      </PopoverTrigger>
      <PopoverContent className="text-sm" side="bottom" align="start">
        {resonance.description}
      </PopoverContent>
    </Popover>
  );
}

export function TeamResonance({ members }: TeamResonanceProps): JSX.Element | null {
  const party = partyElements(members);
  const resonances = getActiveResonances(party);
  if (resonances.length === 0) return null;

  return (
    <ul className="gap-1.5 flex flex-wrap items-center" aria-label="Elemental resonance">
      {resonances.map((resonance) => (
        <li key={resonance.id}>
          <ResonanceBadge resonance={resonance} party={party} />
        </li>
      ))}
    </ul>
  );
}
