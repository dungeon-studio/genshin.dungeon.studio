// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface UserQuerySync {
  mutationKey: QueryKey;
  onMutate: () => Promise<void>;
  onSuccess: () => void;
}

/**
 * Build the mutation options that keep a user-scoped query in step with
 * writes to it, for spreading into `useMutation`.
 *
 * A refetch that started before a write can answer with data that predates
 * it, so starting a write cancels any refetch in flight, and only the last
 * pending write to succeed refetches. A query without data yet keeps its
 * first fetch, since nothing else would restart it. Signed-out users have no
 * query to sync, so the handlers are no-ops without a `userId`.
 *
 * The refetch is deliberately not awaited: returning it would hold the
 * mutation pending until the refetch settled.
 */
export function syncUserQuery(
  queryClient: QueryClient,
  userId: string | undefined,
  keyFor: (userId: string) => QueryKey,
): UserQuerySync {
  const mutationKey = keyFor(userId ?? '');

  return {
    mutationKey,
    onMutate: async () => {
      if (userId === undefined) return;
      if (queryClient.getQueryData(mutationKey) === undefined) return;
      await queryClient.cancelQueries({ queryKey: mutationKey });
    },
    onSuccess: () => {
      if (userId === undefined) return;
      if (queryClient.isMutating({ mutationKey }) > 1) return;
      void queryClient.invalidateQueries({ queryKey: mutationKey });
    },
  };
}
