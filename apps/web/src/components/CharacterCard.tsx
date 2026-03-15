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

const ELEMENT_FOCUS_RINGS: Record<Element, string> = {
  Pyro: 'focus-visible:ring-pyro',
  Hydro: 'focus-visible:ring-hydro',
  Electro: 'focus-visible:ring-electro',
  Cryo: 'focus-visible:ring-cryo',
  Anemo: 'focus-visible:ring-anemo',
  Geo: 'focus-visible:ring-geo',
  Dendro: 'focus-visible:ring-dendro',
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

  const sharedClassName = cn(
    'relative flex items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors',
    ELEMENT_BORDER_COLORS[character.element],
    !owned && 'opacity-40 grayscale',
  );

  const content = (
    <>
      <img src={elementIconSrc} alt={character.element} className="h-6 w-6 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-card-foreground">{character.name}</p>
        <span className="text-xs text-geo-dark" aria-hidden="true">
          {'\u2605'.repeat(character.rarity)}
        </span>
        <span className="sr-only">{character.rarity}-star</span>
      </div>

      {owned && (
        <span
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold text-muted-foreground"
          aria-label={`Constellation level ${constellationLevel}`}
        >
          C{constellationLevel}
        </span>
      )}
    </>
  );

  if (!onSelect) {
    return <div className={sharedClassName}>{content}</div>;
  }

  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(character.id)}
      className={cn(
        sharedClassName,
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        selected
          ? cn(
              'ring-2 ring-offset-2 ring-offset-background',
              ELEMENT_SELECTED_RINGS[character.element],
              ELEMENT_FOCUS_RINGS[character.element],
            )
          : 'focus-visible:ring-ring',
      )}
    >
      {content}
    </motion.button>
  );
}
