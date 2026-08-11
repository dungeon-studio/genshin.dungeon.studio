// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { JSX } from 'react';
import { Link } from 'react-router-dom';

import { BrandMark } from '@/components/chrome/brand-mark';
import { Container } from '@/components/chrome/container';
import { ThemeToggle } from '@/components/chrome/theme-toggle';
import { LoginButton, LogoutButton, useAuth } from '@/features/auth';

export function Header(): JSX.Element {
  const { user, loading } = useAuth();

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
          {!loading && (user ? <UserMenu user={user} /> : <LoginButton />)}
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}

function UserMenu({ user }: { user: { displayName: string | null; photoURL: string | null } }) {
  return (
    <div className="gap-3 flex items-center">
      {user.photoURL ? (
        <img
          src={user.photoURL}
          alt=""
          aria-hidden="true"
          className="h-8 w-8 rounded-full"
          referrerPolicy="no-referrer"
        />
      ) : null}
      <span className="text-sm font-medium text-foreground">{user.displayName ?? 'User'}</span>
      <LogoutButton />
    </div>
  );
}
