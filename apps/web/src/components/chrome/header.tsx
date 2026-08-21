// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut } from 'firebase/auth';
import { ChevronDown } from 'lucide-react';
import type { JSX } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { BrandMark } from '@/components/chrome/brand-mark';
import { Container } from '@/components/chrome/container';
import { ThemeToggle } from '@/components/chrome/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DeleteAccountDialog } from '@/features/account';
import { LoginButton, useAuth } from '@/features/auth';
import { auth } from '@/lib/firebase';

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

async function handleSignOut() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
  }
}

function UserMenu({ user }: { user: { displayName: string | null; photoURL: string | null } }) {
  const [deleting, setDeleting] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" className="gap-2 px-2 flex items-center">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt=""
                aria-hidden="true"
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span className="text-sm font-medium">{user.displayName ?? 'User'}</span>
            <ChevronDown aria-hidden="true" focusable={false} className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => {
              void handleSignOut();
            }}
          >
            Sign out
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Radix unmounts the menu on select, so the dialog lives outside it
              and opens from state rather than nesting under this item. */}
          <DropdownMenuItem
            destructive
            onSelect={() => {
              setDeleting(true);
            }}
          >
            Delete account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DeleteAccountDialog open={deleting} onOpenChange={setDeleting} />
    </>
  );
}
