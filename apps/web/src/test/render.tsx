// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';

import { AuthContext } from '@/features/auth/auth-context';

// The composite hooks only read `user.uid`; a partial User is sufficient.
export function fakeUser(uid: string): User {
  return { uid } as User;
}

export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Fail fast so error paths (rollback) resolve without retry backoff.
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface WrapperOptions {
  user?: User | null;
  loading?: boolean;
  queryClient?: QueryClient;
}

// Provides the TanStack Query and auth context the collection/team hooks need.
export function createWrapper(
  options: WrapperOptions = {},
): (props: { children: ReactNode }) => ReactNode {
  const { user = null, loading = false, queryClient = createTestQueryClient() } = options;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
      </QueryClientProvider>
    );
  };
}
