// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { onAuthStateChanged } from '@firebase/auth';
import { useEffect, useState } from 'react';
import type { JSX, ReactNode } from 'react';

import { auth } from '@/lib/firebase';

import type { AuthState } from './auth-context';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setState(
        firebaseUser ? { status: 'signed-in', user: firebaseUser } : { status: 'signed-out' },
      );
    });

    return unsubscribe;
  }, []);

  return <AuthContext value={state}>{children}</AuthContext>;
}
