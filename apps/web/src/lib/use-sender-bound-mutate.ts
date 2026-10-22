// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { MutateOptions } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

type Mutate<TData, TError, TVariables> = (
  variables: TVariables,
  options?: MutateOptions<TData, TError, TVariables>,
) => void;

/**
 * Wraps `mutate` so each call's `onSuccess` and `onError` run only while the
 * user who sent the request is still the one signed in.
 *
 * A response that settles after sign-out, or after another account signs in,
 * would otherwise write the previous user's result or rollback into the next
 * user's store. `onSettled` still runs, for cleanup that isn't per-user.
 */
export function useSenderBoundMutate<TData, TError, TVariables>(
  userId: string | undefined,
  mutate: Mutate<TData, TError, TVariables>,
): Mutate<TData, TError, TVariables> {
  const currentUserId = useRef(userId);

  useEffect(() => {
    currentUserId.current = userId;
  }, [userId]);

  return useCallback<Mutate<TData, TError, TVariables>>(
    (variables, options) => {
      const sender = currentUserId.current;
      const whileSenderSignedIn =
        <A extends unknown[]>(callback: ((...args: A) => void) | undefined) =>
        (...args: A) => {
          if (currentUserId.current === sender) callback?.(...args);
        };

      mutate(variables, {
        ...options,
        onSuccess: whileSenderSignedIn(options?.onSuccess),
        onError: whileSenderSignedIn(options?.onError),
      });
    },
    [mutate],
  );
}
