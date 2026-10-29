// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/chrome/empty-state';
import { Button } from '@/components/ui/button';
import { SignInPrompt, useAuth } from '@/features/auth';

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
 * account, so the page it would link to can't add anything.
 */
export function EmptyCollection({
  icon,
  title,
  description,
  to,
  action,
  className,
}: EmptyCollectionProps): JSX.Element {
  if (useAuth().status === 'signed-out') {
    return (
      <SignInPrompt
        icon={icon}
        title={title}
        description="Sign in to start your collection."
        className={className}
      />
    );
  }

  return (
    <EmptyState icon={icon} title={title} description={description} className={className}>
      <Button asChild>
        <Link to={to}>{action}</Link>
      </Button>
    </EmptyState>
  );
}
