// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { User } from 'firebase/auth';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthContext } from '@/features/auth/auth-context';
import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createTestQueryClient, createWrapper, fakeUser } from '@/test/render';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { useCollection } from './use-character-collection';
import { useCollectionStore } from './use-character-collection-store';

const SKIRK = 'skirk' as CharacterId;
const ESCOFFIER = 'escoffier' as CharacterId;

beforeEach(() => {
  useCollectionStore.getState().clearCharacters();
  vi.clearAllMocks();
});

describe('useCollection account isolation', () => {
  it('clears the collection on logout so a different user starts fresh', async () => {
    let serverCharacters = charactersDocument([makeCharacter(SKIRK, 3)]);
    server.use(
      http.get('http://localhost:8080/api/characters', () => HttpResponse.json(serverCharacters)),
    );

    const queryClient = createTestQueryClient();
    let authUser: User | null = fakeUser('user-1');
    function Wrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AuthContext.Provider value={{ user: authUser, loading: false }}>
            {children}
          </AuthContext.Provider>
        </QueryClientProvider>
      );
    }

    const { result, rerender } = renderHook(() => useCollection(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeDefined());

    // A second account signs in.
    serverCharacters = charactersDocument([makeCharacter(ESCOFFIER, 2)]);
    act(() => {
      authUser = null;
      rerender();
    });
    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeUndefined());

    act(() => {
      authUser = fakeUser('user-2');
      rerender();
    });

    await waitFor(() => expect(result.current.getCharacter(ESCOFFIER)?.constellationLevel).toBe(2));
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
  });
});

describe('useCollection when signed out', () => {
  it('refuses to add a character', () => {
    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: null }),
    });

    act(() => {
      result.current.addCharacter(SKIRK);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
  });
});

describe('useCollection mutations', () => {
  it('restores a removed character when the delete fails', async () => {
    server.use(
      http.get('http://localhost:8080/api/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK, 3)])),
      ),
      http.delete(
        'http://localhost:8080/api/characters/skirk',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderHook(() => useCollection(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));

    act(() => {
      result.current.removeCharacter(SKIRK);
    });

    // Optimistically gone, then restored at its prior level once the delete errors.
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
    await waitFor(() => expect(result.current.getCharacter(SKIRK)?.constellationLevel).toBe(3));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });
});
