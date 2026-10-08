// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { onAuthStateChanged } from '@firebase/auth';
import { useEffect, useState } from 'react';
import type { JSX, ReactNode } from 'react';

import { auth } from '@/lib/firebase';

import type { AuthUser } from './auth-context';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return <AuthContext value={{ user, loading }}>{children}</AuthContext>;
}
