// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { useCallback, useEffect, useRef } from 'react';

interface SenderBoundCallbacks<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  onSettled?: () => void;
}

type MutateAsync<TData, TVariables> = (variables: TVariables) => Promise<TData>;

export type SenderBoundMutate<TData, TVariables> = (
  variables: TVariables,
  callbacks?: SenderBoundCallbacks<TData>,
) => void;

/**
 * Runs each call's `onSuccess` and `onError` only while the user who sent the
 * request is still signed in, so a late response or rollback never reaches the
 * next user's store. `onSettled` always runs, for cleanup that isn't per-user.
 *
 * Every call keeps its own callbacks. `mutate`'s per-call callbacks fire only
 * for the latest call, which would drop an earlier request's failure.
 */
export function useSenderBoundMutate<TData, TVariables>(
  userId: string | undefined,
  mutateAsync: MutateAsync<TData, TVariables>,
): SenderBoundMutate<TData, TVariables> {
  const currentUserId = useRef(userId);

  useEffect(() => {
    currentUserId.current = userId;
  }, [userId]);

  return useCallback<SenderBoundMutate<TData, TVariables>>(
    (variables, callbacks) => {
      const sender = currentUserId.current;
      const whileSenderSignedIn =
        <A extends unknown[]>(callback: ((...args: A) => void) | undefined) =>
        (...args: A) => {
          if (currentUserId.current === sender) callback?.(...args);
        };

      mutateAsync(variables)
        .then(whileSenderSignedIn(callbacks?.onSuccess), whileSenderSignedIn(callbacks?.onError))
        .finally(() => callbacks?.onSettled?.());
    },
    [mutateAsync],
  );
}
