// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface UserQuerySync {
  mutationKey?: QueryKey;
  onMutate: () => Promise<void>;
  onSettled: () => void;
}

const SIGNED_OUT: UserQuerySync = {
  onMutate: async () => {},
  onSettled: () => {},
};

/**
 * The mutation options that keep a user-scoped query in step with writes to
 * it, for spreading into `useMutation`.
 *
 * A refetch that starts before a write can answer with data that predates it.
 * Starting a write cancels any refetch in flight, and a write that settles
 * while another is pending leaves the refetch to the one still pending. A
 * failed write refetches too: a rollback guarded against newer edits can skip
 * one failure and revert another, leaving a value the server never stored. A
 * first load is never cancelled, because nothing would restart it.
 *
 * The refetch isn't awaited: returning it would hold the mutation pending
 * until the refetch settled.
 */
export function useUserQuerySync(
  userId: string | undefined,
  keyFor: (userId: string) => QueryKey,
): UserQuerySync {
  const queryClient = useQueryClient();
  if (userId === undefined) return SIGNED_OUT;

  const queryKey = keyFor(userId);

  return {
    mutationKey: queryKey,
    onMutate: async () => {
      if (queryClient.getQueryData(queryKey) === undefined) return;
      await queryClient.cancelQueries({ queryKey });
    },
    onSettled: () => {
      if (pendingWrites(queryClient, queryKey) > 1) return;
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * A check for whether a write through `useUserQuerySync` is still waiting on
 * the server. It reads at call time, so an effect sees writes started after
 * the render. A query answer that lands while one is pending predates it.
 */
export function useUserWritePending(
  userId: string | undefined,
  keyFor: (userId: string) => QueryKey,
): () => boolean {
  const queryClient = useQueryClient();
  return useCallback(
    () => userId !== undefined && pendingWrites(queryClient, keyFor(userId)) > 0,
    [queryClient, userId, keyFor],
  );
}

function pendingWrites(queryClient: QueryClient, queryKey: QueryKey): number {
  return queryClient.isMutating({ mutationKey: queryKey });
}
