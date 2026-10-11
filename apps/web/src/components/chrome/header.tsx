// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { BrandMark } from '@/components/chrome/brand-mark';
import { Container } from '@/components/chrome/container';
import { ThemeToggle } from '@/components/chrome/theme-toggle';
import { AccountMenu } from '@/features/account';
import { LoginButton, useAuth } from '@/features/auth';

export function Header(): JSX.Element {
  const auth = useAuth();

  return (
    <header className="border-b border-border bg-background">
      <Container className="py-4 flex items-center justify-between">
        <Link
          to="/"
          className="gap-2 text-2xl font-bold flex items-center text-foreground hover:text-foreground/80"
        >
          <BrandMark />
          Genshin Planner
        </Link>
        <div className="gap-3 flex items-center">
          {auth.status === 'signed-in' && <AccountMenu user={auth.user} />}
          {auth.status === 'signed-out' && <LoginButton />}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}
