// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CircleHelp } from 'lucide-react';
import type { JSX } from 'react';

import { cn } from '@/lib/utils';

import { ICON_SLOT } from './item-summary';

const SHAPE_CLASSES = {
  circle: 'rounded-full',
  square: 'rounded-md',
} as const;

interface EmptyItemIconProps {
  /** Echoes the icon it stands in for: element icons are circular, weapon types squared. */
  shape: keyof typeof SHAPE_CLASSES;
}

export function EmptyItemIcon({ shape }: EmptyItemIconProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex',
        ICON_SLOT,
        'items-center justify-center',
        SHAPE_CLASSES[shape],
        'bg-muted text-muted-foreground opacity-30',
      )}
    >
      <CircleHelp className="h-5 w-5" aria-hidden="true" focusable={false} />
    </div>
  );
}
