// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthState } from './auth-context';

/** `undefined` both while auth settles and once signed out; `auth.status` tells them apart. */
export function signedInUid(auth: AuthState): string | undefined {
  return auth.status === 'signed-in' ? auth.user.uid : undefined;
}

/**
 * Whether a per-user view is still waiting on its data.
 *
 * Auth settling counts as waiting: reporting ready earlier renders the
 * signed-out view to a signed-in user.
 */
export function awaitingUserData(auth: AuthState, queryLoading: boolean): boolean {
  return auth.status === 'loading' || (auth.status === 'signed-in' && queryLoading);
}
