// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyCollectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** The collection page that fills the gap. */
  to: string;
  action: string;
  className?: string;
}

/** Stands in for a view that has nothing to show until the user adds to a collection. */
export function EmptyCollection({
  icon: Icon,
  title,
  description,
  to,
  action,
  className,
}: EmptyCollectionProps): JSX.Element {
  return (
    <div className={cn('gap-4 py-12 flex flex-1 flex-col items-center justify-center', className)}>
      <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" focusable={false} />
      <div className="text-center">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Button asChild>
        <Link to={to}>{action}</Link>
      </Button>
    </div>
  );
}
