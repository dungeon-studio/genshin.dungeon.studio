// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';

import { EmptyState } from '@/components/chrome/empty-state';
import { Button } from '@/components/ui/button';

import { signInWithGoogle } from './sign-in';

interface SignInPromptProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}

/** Empty state for a view whose content needs an account. */
export function SignInPrompt({
  icon,
  title,
  description,
  className,
}: SignInPromptProps): JSX.Element {
  return (
    <EmptyState icon={icon} title={title} description={description} className={className}>
      <Button type="button" onClick={() => void signInWithGoogle()}>
        Sign in
      </Button>
    </EmptyState>
  );
}
