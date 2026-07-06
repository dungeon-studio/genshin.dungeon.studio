// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';

interface ItemSummaryProps {
  /** 10x10 icon slot; the parent owns the empty-state bubble and any dimming. */
  icon: ReactNode;
  name?: string;
  rarity?: number;
  /** Trailing detail line, joined after the rarity stars (e.g. `Bow · Mondstadt`). */
  metadata?: string;
  /** Muted label shown in place of the name when no item is present. */
  emptyLabel: string;
}

/**
 * Shared layout for character and weapon summaries: an icon slot beside a name
 * with rarity stars and a metadata line, falling back to a muted empty label.
 * Returns sibling nodes for composition inside a flex row.
 */
export function ItemSummary({
  icon,
  name,
  rarity,
  metadata,
  emptyLabel,
}: ItemSummaryProps): JSX.Element {
  return (
    <>
      {icon}

      <div className="min-w-0 flex-1">
        {name ? (
          <>
            <p className="truncate text-sm font-semibold text-card-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              <span className="text-geo-dark" aria-hidden="true">
                {rarity}★
              </span>
              <span className="sr-only">{rarity}-star</span>
              {` · ${metadata}`}
            </p>
          </>
        ) : (
          <p className="truncate text-sm font-semibold text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </>
  );
}
