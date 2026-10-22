// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { QueryClient } from '@tanstack/react-query';
import type { RenderHookResult } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { AuthState, AuthUser } from '@/features/auth';
import { settledAuth } from '@/test/auth';
import { TestProviders } from '@/test/providers';

// The composite hooks only read `user.uid`; a partial `AuthUser` is sufficient.
export function fakeUser(uid: string): AuthUser {
  return { uid } as AuthUser;
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
  user?: AuthUser | null;
  queryClient?: QueryClient;
}

/** Auth arrives through `auth.current`, so a test can change it between `rerender()` calls. */
function authWrapper(
  auth: { current: AuthState },
  queryClient: QueryClient,
): (props: { children: ReactNode }) => ReactNode {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders queryClient={queryClient} auth={auth.current}>
        {children}
      </TestProviders>
    );
  };
}

// Binds one set of provider values for the tests that never change them.
export function createWrapper(
  options: WrapperOptions = {},
): (props: { children: ReactNode }) => ReactNode {
  const { user = null, queryClient = createTestQueryClient() } = options;
  return authWrapper({ current: settledAuth(user) }, queryClient);
}

interface SignedInHook<T> extends RenderHookResult<T, unknown> {
  queryClient: QueryClient;
  /** Ends the session and re-renders, as Firebase reporting sign-out would. */
  signOut: () => void;
}

/** Renders `hook` signed in as `uid`, for tests that sign out while it's mounted. */
export function renderHookSignedIn<T>(hook: () => T, uid: string): SignedInHook<T> {
  const auth = { current: settledAuth(fakeUser(uid)) };
  const queryClient = createTestQueryClient();
  const view = renderHook(hook, { wrapper: authWrapper(auth, queryClient) });

  return {
    ...view,
    queryClient,
    signOut: () => {
      auth.current = settledAuth(null);
      view.rerender();
    },
  };
}
