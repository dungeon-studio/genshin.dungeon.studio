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
 * A refetch that starts before a write can answer with data that predates it.
 * Starting a write cancels any refetch in flight, and a write that succeeds
 * while another is pending leaves the refetch to the later one. A first load
 * is never cancelled, because nothing would restart it.
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
      if (queryClient.isMutating({ mutationKey: queryKey }) > 1) return;
      void queryClient.invalidateQueries({ queryKey });
    },
  };
}
