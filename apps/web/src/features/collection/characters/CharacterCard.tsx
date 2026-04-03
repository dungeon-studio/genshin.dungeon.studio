// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { MAX_CONSTELLATION_LEVEL, MIN_CONSTELLATION_LEVEL } from '@genshin/domain';
import type { Character } from '@genshin/game-data';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ELEMENT_BORDER_COLORS,
  ELEMENT_BORDER_COLORS_DIM,
  ELEMENT_FOCUS_RINGS,
  ELEMENT_SELECTED_RINGS,
} from '@/lib/elementStyles';
import { getElementIconPath } from '@/lib/elements';
import { cn } from '@/lib/utils';

const CONSTELLATION_LEVELS = Array.from(
  { length: MAX_CONSTELLATION_LEVEL - MIN_CONSTELLATION_LEVEL + 1 },
  (_, i) => MIN_CONSTELLATION_LEVEL + i,
);

interface CharacterCardProps {
  character: Character;
  owned?: boolean;
  constellationLevel?: number;
  selected?: boolean;
  onAdd?: (characterId: Character['id']) => void;
  onRemove?: (characterId: Character['id']) => void;
  onConstellationChange?: (characterId: Character['id'], level: number) => void;
}

export function CharacterCard({
  character,
  owned = false,
  constellationLevel = MIN_CONSTELLATION_LEVEL,
  selected = false,
  onAdd,
  onRemove,
  onConstellationChange,
}: CharacterCardProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const elementIconSrc = getElementIconPath(character.element);

  const borderColors = owned ? ELEMENT_BORDER_COLORS : ELEMENT_BORDER_COLORS_DIM;

  const sharedClassName = cn(
    'relative flex w-full items-center gap-3 rounded-lg border border-border border-l-4 bg-card p-3 text-left shadow-sm transition-colors',
    borderColors[character.element],
  );

  const content = (
    <>
      <img
        src={elementIconSrc}
        alt={character.element}
        loading="lazy"
        decoding="async"
        className={cn('h-10 w-10 shrink-0', !owned && 'opacity-30')}
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

      {owned && onConstellationChange && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-bold tabular-nums text-muted-foreground hover:bg-muted/80"
              aria-label={`Constellation level ${constellationLevel} for ${character.name}, click to edit`}
            >
              C{constellationLevel}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-2"
            side="top"
            align="end"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1.5 text-center text-xs font-medium text-muted-foreground">
              Constellation
            </p>
            <div className="flex gap-1">
              {CONSTELLATION_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    onConstellationChange(character.id, level);
                    setPopoverOpen(false);
                  }}
                  className={cn(
                    'h-7 w-7 rounded text-xs font-bold tabular-nums transition-colors',
                    level === constellationLevel
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                  aria-label={`Set constellation level ${level}`}
                  aria-pressed={level === constellationLevel}
                >
                  {level}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {owned && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(character.id);
          }}
          className="relative z-10 shrink-0 rounded-md p-1 text-destructive opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
          aria-label={`Remove ${character.name} from collection`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </>
  );

  if (!onAdd && !onRemove) {
    return <div className={sharedClassName}>{content}</div>;
  }

  if (owned) {
    return (
      <div
        className={cn(
          sharedClassName,
          'group',
          selected &&
            cn(
              'ring-2 ring-offset-2 ring-offset-background',
              ELEMENT_SELECTED_RINGS[character.element],
            ),
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onAdd?.(character.id)}
      className={cn(
        sharedClassName,
        'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        selected
          ? cn(
              'ring-2 ring-offset-2 ring-offset-background',
              ELEMENT_SELECTED_RINGS[character.element],
              ELEMENT_FOCUS_RINGS[character.element],
            )
          : 'focus-visible:ring-ring',
      )}
      aria-label={`Add ${character.name} to collection`}
    >
      {content}
    </motion.button>
  );
}
