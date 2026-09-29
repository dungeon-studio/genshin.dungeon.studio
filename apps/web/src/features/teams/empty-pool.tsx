// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';

interface EmptyPoolProps {
  icon: LucideIcon;
  heading: string;
  body: string;
  ctaLabel: string;
  to: string;
}

/** Stands in for a pool with nothing owned, pointing at the page that adds to it. */
export function EmptyPool({
  icon: Icon,
  heading,
  body,
  ctaLabel,
  to,
}: EmptyPoolProps): JSX.Element {
  return (
    <div className="gap-4 py-12 flex flex-1 flex-col items-center justify-center">
      <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" focusable={false} />
      <div className="text-center">
        <p className="font-medium">{heading}</p>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
      </div>
      <Button asChild>
        <Link to={to}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
