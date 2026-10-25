// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { signInWithGoogle, useAuth } from '@/features/auth';
import { cn } from '@/lib/class-names';

interface EmptyCollectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  action: string;
  className?: string;
}

/**
 * Empty state for a view that needs collection entries before it can show anything.
 *
 * Signed out, it offers sign-in in place of `to`: a collection belongs to an
 * account, so the page it would link to can't add anything yet.
 */
export function EmptyCollection({
  icon: Icon,
  title,
  description,
  to,
  action,
  className,
}: EmptyCollectionProps): JSX.Element {
  const signedOut = useAuth().status === 'signed-out';

  return (
    <div className={cn('gap-4 py-12 flex flex-1 flex-col items-center justify-center', className)}>
      <Icon className="h-10 w-10 text-muted-foreground" aria-hidden="true" focusable={false} />
      <div className="text-center">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {signedOut ? 'Sign in to start your collection.' : description}
        </p>
      </div>
      {signedOut ? (
        <Button type="button" onClick={() => void signInWithGoogle()}>
          Sign in
        </Button>
      ) : (
        <Button asChild>
          <Link to={to}>{action}</Link>
        </Button>
      )}
    </div>
  );
}
