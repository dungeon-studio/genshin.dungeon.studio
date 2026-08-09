// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Builds an `onSuccess` handler that refetches a user-scoped query.
 *
 * Signed-out users have no query to refetch, so the handler is a no-op without a
 * `userId`. The invalidation is deliberately not awaited: returning it would
 * hold the mutation pending until the refetch settled.
 *
 * @param queryClient - the client the mutation already holds.
 * @param userId - the signed-in user, or `undefined` when signed out.
 * @param keyFor - the feature's query-key builder.
 * @returns a handler suitable for `useMutation`'s `onSuccess`.
 */
export function invalidateUserQuery(
  queryClient: QueryClient,
  userId: string | undefined,
  keyFor: (userId: string) => QueryKey,
): () => void {
  return () => {
    if (userId === undefined) return;
    void queryClient.invalidateQueries({ queryKey: keyFor(userId) });
  };
}
