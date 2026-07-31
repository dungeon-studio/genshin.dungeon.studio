// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';

/** Sizing for the icon slot, shared by real icons and the empty-state placeholder. */
export const ICON_SLOT = 'h-10 w-10 shrink-0';

interface SummaryItem {
  name: string;
  rarity: number;
  /** Trailing detail line, joined after the rarity stars (e.g. `Bow · Mondstadt`). */
  metadata: string;
}

interface ItemSummaryProps {
  /** Fills the icon slot; the parent owns the empty-state placeholder and any dimming. */
  icon: ReactNode;
  /** Absent when nothing occupies the slot, collapsing the summary to `emptyLabel`. */
  item?: SummaryItem;
  /** Muted label shown in place of the name when no item is present. */
  emptyLabel: string;
}

/**
 * Shared layout for character and weapon summaries: an icon slot beside a name
 * with rarity stars and a metadata line, falling back to a muted empty label.
 * Returns sibling nodes for composition inside a flex row.
 */
export function ItemSummary({ icon, item, emptyLabel }: ItemSummaryProps): JSX.Element {
  return (
    <>
      {icon}

      <div className="min-w-0 flex-1">
        {item ? (
          <>
            <p className="truncate text-sm font-semibold text-card-foreground">{item.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              <span className="text-geo-dark" aria-hidden="true">
                {item.rarity}★
              </span>
              <span className="sr-only">{item.rarity}-star</span>
              {` · ${item.metadata}`}
            </p>
          </>
        ) : (
          <p className="truncate text-sm font-semibold text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </>
  );
}
