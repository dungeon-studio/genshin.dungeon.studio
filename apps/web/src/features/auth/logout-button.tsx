// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

export function LogoutButton(): JSX.Element {
  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }

  return (
    <Button type="button" onClick={handleLogout} variant="ghost" size="icon" aria-label="Sign out">
      <LogOut aria-hidden="true" focusable={false} className="h-4 w-4" />
    </Button>
  );
}
