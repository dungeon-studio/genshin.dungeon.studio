// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export interface UserQuerySync {
  mutationKey?: QueryKey;
  onMutate: () => Promise<void>;
  onSuccess: () => void;
}

const SIGNED_OUT: UserQuerySync = {
  onMutate: async () => {},
  onSuccess: () => {},
};

/**
 * The mutation options that keep a user-scoped query in step with writes to
 * it, for spreading into `useMutation`.
 *
 * A refetch that starts before a write can answer with data that predates it.
 * Starting a write cancels any refetch in flight, and a write that succeeds
 * while another is pending leaves the refetch to the one still pending. A
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
    onSuccess: () => {
      if (pendingWrites(queryClient, queryKey) > 1) return;
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}

/**
 * Whether a write through `useUserQuerySync` is still waiting on the server,
 * read when called rather than at render, so an effect sees writes started
 * since. An answer that lands meanwhile predates that write.
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
