// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryKey } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';

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
 * A refetch that started before a write can answer with data that predates
 * it, so starting a write cancels any refetch in flight, and only the last
 * pending write to succeed refetches. A query without data yet keeps its
 * first fetch, since nothing else would restart it. Signed-out users have no
 * query to sync, so their handlers do nothing.
 *
 * The refetch is deliberately not awaited: returning it would hold the
 * mutation pending until the refetch settled.
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
      if (queryClient.isMutating({ mutationKey: queryKey }) > 1) return;
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}
