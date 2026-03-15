// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Element } from '@genshin/game-data';
import { MIN_CONSTELLATION_LEVEL } from '@genshin/types';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const ELEMENT_BORDER_COLORS: Record<Element, string> = {
  Pyro: 'border-l-pyro',
  Hydro: 'border-l-hydro',
  Electro: 'border-l-electro',
  Cryo: 'border-l-cryo',
  Anemo: 'border-l-anemo',
  Geo: 'border-l-geo',
  Dendro: 'border-l-dendro',
};

const ELEMENT_SELECTED_RINGS: Record<Element, string> = {
  Pyro: 'ring-pyro',
  Hydro: 'ring-hydro',
  Electro: 'ring-electro',
  Cryo: 'ring-cryo',
  Anemo: 'ring-anemo',
  Geo: 'ring-geo',
  Dendro: 'ring-dendro',
};

interface CharacterCardProps {
  character: Character;
  owned?: boolean;
  constellationLevel?: number;
  selected?: boolean;
  onSelect?: (characterId: Character['id']) => void;
}

export function CharacterCard({
  character,
  owned = false,
  constellationLevel = MIN_CONSTELLATION_LEVEL,
  selected = false,
  onSelect,
}: CharacterCardProps) {
  const elementIconSrc = `/elements/${character.element.toLowerCase()}.png`;
  const elementRing = ELEMENT_SELECTED_RINGS[character.element];

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect?.(character.id)}
      className={cn(
        'relative flex items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        ELEMENT_BORDER_COLORS[character.element],
        !owned && 'opacity-40 grayscale',
        selected
          ? cn(
              'ring-2 ring-offset-2 ring-offset-background',
              elementRing,
              `focus-visible:${elementRing}`,
            )
          : 'focus-visible:ring-ring',
      )}
    >
      <img src={elementIconSrc} alt={character.element} className="h-6 w-6 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-card-foreground">{character.name}</p>
        <span className="text-xs text-geo-dark" aria-label={`${character.rarity}-star`}>
          {'★'.repeat(character.rarity)}
        </span>
      </div>

      {owned && (
        <span
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground"
          aria-label={`Constellation level ${constellationLevel}`}
        >
          C{constellationLevel}
        </span>
      )}
    </motion.button>
  );
}
