// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Link } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginButton, LogoutButton, useAuth } from '@/features/auth';

export function Header() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-2xl font-bold text-foreground hover:text-foreground/80"
        >
          <img
            src="/favicon-32x32.png"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="dark:hidden"
          />
          <img
            src="/favicon-32x32-dark.png"
            alt=""
            aria-hidden="true"
            width={32}
            height={32}
            className="hidden dark:block"
          />
          Genshin Planner
        </Link>
        <div className="flex items-center gap-3">
          {!loading && (user ? <UserMenu user={user} /> : <LoginButton />)}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

function UserMenu({ user }: { user: { displayName: string | null; photoURL: string | null } }) {
  return (
    <div className="flex items-center gap-3">
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
