// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { ChevronDown } from 'lucide-react';
import type { JSX } from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/sign-out';

import { DeleteAccountDialog } from './delete-account-dialog';

export interface AccountMenuProps {
  user: { displayName: string | null; photoURL: string | null };
}

/** Everything a signed-in user can do to the account itself. */
export function AccountMenu({ user }: AccountMenuProps): JSX.Element {
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
              void signOut();
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
