// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FilterToggleProps {
  expanded: boolean;
  onToggle: () => void;
  activeCount: number;
  controlsId: string;
}

export function FilterToggle({
  expanded,
  onToggle,
  activeCount,
  controlsId,
}: FilterToggleProps): JSX.Element {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-controls={controlsId}
      // Without an explicit label the badge joins the text: "Filters3".
      aria-label={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}
    >
      <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" focusable={false} />
      Filters
      {activeCount > 0 && (
        <span className="px-1.5 text-xs font-medium rounded-full bg-foreground text-background">
          {activeCount}
        </span>
      )}
      <ChevronDown
        className={cn('h-3.5 w-3.5 transition-transform', expanded && 'rotate-180')}
        aria-hidden="true"
        focusable={false}
      />
    </Button>
  );
}
