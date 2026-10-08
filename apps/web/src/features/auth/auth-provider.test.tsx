// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { onAuthStateChanged } from '@firebase/auth';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fakeUser } from '@/test/render';

import type { AuthUser } from './auth-context';
import { AuthProvider } from './auth-provider';
import { useAuth } from './use-auth';

vi.mock('@firebase/auth', () => ({ onAuthStateChanged: vi.fn() }));

let reportSession: (user: AuthUser | null) => void;

beforeEach(() => {
  vi.mocked(onAuthStateChanged).mockImplementation((_auth, observer) => {
    reportSession = observer as (user: AuthUser | null) => void;
    return vi.fn();
  });
});

function renderAuth() {
  return renderHook(() => useAuth(), { wrapper: AuthProvider });
}

describe('AuthProvider', () => {
  it('stays loading until Firebase reports the restored session', () => {
    const { result } = renderAuth();

    expect(result.current).toEqual({ user: null, loading: true });

    const user = fakeUser('user-1');
    act(() => {
      reportSession(user);
    });

    expect(result.current).toEqual({ user, loading: false });
  });

  it('settles signed out when Firebase finds no session', () => {
    const { result } = renderAuth();

    act(() => {
      reportSession(null);
    });

    expect(result.current).toEqual({ user: null, loading: false });
  });
});
