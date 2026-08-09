// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient, QueryKey } from '@tanstack/react-query';

/**
 * Build an `onSuccess` handler that refetches a user-scoped query. Signed-out
 * users have no query to refetch, so it is a no-op without a `userId`.
 *
 * The invalidation is deliberately not awaited: returning it would hold the
 * mutation pending until the refetch settled.
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
