// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { UseQueryResult } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { AuthState } from './auth-context';
import { awaitingUserData } from './auth-state';

/** Where a per-user query stands, for a view that gates on it. */
export interface UserDataLoad {
  isLoading: boolean;
  /** The query's latest failure; always `null` signed out. */
  error: Error | null;
  /** The first load failed, so there's no data to show. */
  loadFailed: boolean;
  /** Refetches after a failed load; `isLoading` is true again while it runs. */
  retry: () => void;
}

export function useUserDataLoad(
  auth: AuthState,
  query: UseQueryResult<unknown, Error>,
): UserDataLoad {
  const { data, error: queryError, isLoading, refetch } = query;

  const retry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const error = auth.status === 'signed-in' ? queryError : null;

  return {
    isLoading: awaitingUserData(auth, isLoading),
    error,
    loadFailed: error !== null && data === undefined,
    retry,
  };
}
