// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';

const NEVER_PENDING = (): boolean => false;

/**
 * Copies each answer to a query into a store, replacing what the store held.
 *
 * Every answer replaces the store, even one identical to the last. Structural
 * sharing keeps the data's reference when a refetch returns the same data, so
 * the effect also reruns on `dataUpdatedAt`. Without that, a refetch after a
 * failed write couldn't replace a rollback that left a value the server never
 * stored.
 *
 * An answer that lands while `isWritePending` holds predates the write and is
 * skipped; the last write's refetch replaces it. `replace` and
 * `isWritePending` must keep their identity across renders, or the effect
 * reruns on each one.
 */
export function useReconcileStore<T>(
  { data, dataUpdatedAt }: Pick<UseQueryResult<T>, 'data' | 'dataUpdatedAt'>,
  replace: (data: T) => void,
  isWritePending: () => boolean = NEVER_PENDING,
): void {
  useEffect(() => {
    if (data === undefined || isWritePending()) return;
    replace(data);
  }, [data, dataUpdatedAt, isWritePending, replace]);
}
