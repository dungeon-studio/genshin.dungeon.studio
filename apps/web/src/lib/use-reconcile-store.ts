// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect } from 'react';

const NEVER_PENDING = (): boolean => false;

/**
 * Replaces a store with each answer to a query, even an answer identical to
 * the last. A refetch after a failed write must overwrite the rollback, and
 * structural sharing returns unchanged data under the same reference.
 *
 * An answer that lands while `isWritePending()` is true predates the write, so
 * it's skipped. The last write's refetch replaces it.
 *
 * `replace` and `isWritePending` need stable identities. A new one reruns the
 * effect on every render.
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
