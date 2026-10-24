// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';

import { cn } from '@/lib/class-names';

interface ChipProps {
  active: boolean;
  onClick: () => void;
  activeClassName: string;
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}

export function Chip({
  active,
  onClick,
  activeClassName,
  className,
  ariaLabel,
  children,
}: ChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
        className,
        active ? activeClassName : 'bg-muted text-muted-foreground hover:bg-muted/80',
      )}
      aria-pressed={active}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
