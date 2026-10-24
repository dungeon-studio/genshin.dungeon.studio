// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthState, AuthUser } from '@/features/auth';

/** The state `AuthProvider` settles on once Firebase reports `user`. */
export function settledAuth(user: AuthUser | null): AuthState {
  return user ? { status: 'signed-in', user } : { status: 'signed-out' };
}
