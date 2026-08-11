// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';

export const ICON_SLOT = 'h-10 w-10 shrink-0';

interface SummaryItem {
  name: string;
  rarity: number;
  /** Detail line trailing the rarity stars, e.g. `Bow · Mondstadt`. */
  metadata: string;
}

interface ItemSummaryProps {
  /** The parent owns the empty-state placeholder and any dimming. */
  icon: ReactNode;
  item?: SummaryItem;
  emptyLabel: string;
}

/** Returns sibling nodes rather than a container, so callers own the surrounding flex row. */
export function ItemSummary({ icon, item, emptyLabel }: ItemSummaryProps): JSX.Element {
  return (
    <>
      {icon}

      <div className="min-w-0 flex-1">
        {item ? (
          <>
            <p className="text-sm font-semibold truncate text-card-foreground">{item.name}</p>
            <p className="text-xs truncate text-muted-foreground">
              <span className="text-geo-dark" aria-hidden="true">
                {item.rarity}★
              </span>
              <span className="sr-only">{item.rarity}-star</span>
              {` · ${item.metadata}`}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold truncate text-muted-foreground">{emptyLabel}</p>
        )}
      </div>
    </>
  );
}
