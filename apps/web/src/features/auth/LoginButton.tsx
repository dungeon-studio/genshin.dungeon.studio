// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

export function LoginButton() {
  async function handleLogin() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  }

  return (
    <Button onClick={handleLogin} variant="outline">
      Sign in with Google
    </Button>
  );
}
