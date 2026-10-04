// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX, ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface ChipProps {
  pressed: boolean;
  onClick: () => void;
  pressedClassName: string;
  className?: string;
  label?: string;
  children: ReactNode;
}

export function Chip({
  pressed,
  onClick,
  pressedClassName,
  className,
  label,
  children,
}: ChipProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 text-xs font-medium rounded-full transition-colors',
        className,
        pressed ? pressedClassName : 'bg-muted text-muted-foreground hover:bg-muted/80',
      )}
      aria-pressed={pressed}
      aria-label={label}
    >
      {children}
    </button>
  );
}
