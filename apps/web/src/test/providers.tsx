// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import type { JSX, ReactNode } from 'react';

import { AuthContext } from '@/features/auth/auth-context';

interface TestProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  user?: User | null;
  loading?: boolean;
}

/**
 * The TanStack Query and auth context the collection and team hooks need.
 *
 * Auth arrives as props so a test can sign a different user in between
 * `rerender()` calls.
 */
export function TestProviders({
  children,
  queryClient,
  user = null,
  loading = false,
}: TestProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext value={{ user, loading }}>{children}</AuthContext>
    </QueryClientProvider>
  );
}
