// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { signOut } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

export function LogoutButton() {
  async function handleLogout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  }

  return (
    <Button onClick={handleLogout} variant="outline">
      Sign out
    </Button>
  );
}
