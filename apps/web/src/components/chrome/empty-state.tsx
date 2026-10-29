// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { LucideIcon } from 'lucide-react';
import type { JSX, ReactNode } from 'react';

import { cn } from '@/lib/class-names';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  /** The action that fills the empty view. */
  children: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: EmptyStateProps): JSX.Element {
  return (
    <div className={cn('gap-4 py-12 flex flex-1 flex-col items-center justify-center', className)}>
      <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" focusable={false} />
      <div className="text-center">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
