// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { use } from 'react';

import type { AuthContextValue } from './auth-context';
import { AuthContext } from './auth-context';

/**
 * The signed-in user, or `null` once auth has settled and nobody is signed in.
 *
 * `loading` is true until Firebase has restored any existing session, so a
 * caller that treats a null user as signed out before then flashes the wrong
 * state on every reload.
 *
 * @throws Error when called outside an `AuthProvider`.
 */
export function useAuth(): AuthContextValue {
  const context = use(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
