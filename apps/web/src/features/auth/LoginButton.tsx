// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase';

const googleProvider = new GoogleAuthProvider();

export function LoginButton() {
  async function handleLogin() {
    try {
      // The emulator's popup relay uses postMessage between the popup and opener
      // windows. In proxied environments (Codespaces, devcontainers), the origins
      // don't match and the relay fails with "No matching frame". Redirect flow
      // avoids the cross-window communication entirely.
      if (import.meta.env.DEV) {
        await signInWithRedirect(auth, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
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
