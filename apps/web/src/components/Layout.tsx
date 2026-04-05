// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { Link, NavLink, Outlet } from 'react-router-dom';

import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginButton, LogoutButton, useAuth } from '@/features/auth';

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <Nav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
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
          Genshin Team Builder
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

function Nav() {
  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/characters', label: 'Characters' },
    { to: '/weapons', label: 'Weapons' },
    { to: '/teams', label: 'Teams' },
    { to: '/chat', label: 'Chat' },
  ];

  return (
    <nav className="border-b border-border bg-muted" aria-label="Main navigation">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex gap-8">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `inline-block border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-blue-500 text-foreground'
                    : 'border-transparent text-muted-foreground hover:border-blue-500 hover:text-foreground'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-muted py-8">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground">
        <p>Built with React 19 + TypeScript + Vite</p>
        <p className="mt-2 text-xs text-muted-foreground/70">© 2026 Genshin Team Builder</p>
      </div>
    </footer>
  );
}
