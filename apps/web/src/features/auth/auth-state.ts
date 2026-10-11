// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { AuthState } from './auth-context';

/** The uid whose data to fetch, or `undefined` while nobody is signed in. */
export function signedInUid(auth: AuthState): string | undefined {
  return auth.status === 'signed-in' ? auth.user.uid : undefined;
}

/**
 * Whether a per-user view is still waiting on its data.
 *
 * Auth settling counts as waiting: reporting ready before then renders the
 * signed-out view to a signed-in user. Once signed out, there is nothing left
 * to wait for, whatever the query reports.
 */
export function awaitingUserData(auth: AuthState, queryLoading: boolean): boolean {
  return auth.status === 'loading' || (auth.status === 'signed-in' && queryLoading);
}
