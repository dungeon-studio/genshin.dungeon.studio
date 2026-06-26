// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { LogIn } from 'lucide-react';
import type { JSX } from 'react';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

export function LoginButton(): JSX.Element {
  async function handleLogin() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  }

  return (
    <Button type="button" onClick={handleLogin} variant="outline">
      <LogIn aria-hidden="true" focusable={false} className="h-4 w-4" />
      Sign in
    </Button>
  );
}
