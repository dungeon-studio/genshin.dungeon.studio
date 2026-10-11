// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { use } from 'react';

import type { AuthState } from './auth-context';
import { AuthContext } from './auth-context';

/**
 * Who is signed in, once Firebase has restored any existing session.
 *
 * The state stays `loading` until then, so a caller that treats it as signed
 * out flashes the wrong state on every reload.
 *
 * @throws Error when called outside an `AuthProvider`.
 */
export function useAuth(): AuthState {
  const context = use(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
