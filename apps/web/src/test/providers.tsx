// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import type { JSX, ReactNode } from 'react';

import type { AuthState } from '@/features/auth';
import { AuthContext } from '@/features/auth/auth-context';

interface TestProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  auth: AuthState;
}

/**
 * The TanStack Query and auth context the collection and team hooks need.
 *
 * Auth arrives as props so a test can move it, through loading and between
 * users, across `rerender()` calls.
 */
export function TestProviders({ children, queryClient, auth }: TestProvidersProps): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthContext value={auth}>{children}</AuthContext>
    </QueryClientProvider>
  );
}
