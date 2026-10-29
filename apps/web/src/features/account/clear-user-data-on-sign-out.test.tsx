// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthState } from '@/features/auth';
import { useCollection } from '@/features/collection/characters/use-character-collection';
import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useTeamStore } from '@/features/teams/use-team-store';
import { useTeams } from '@/features/teams/use-teams';
import { settledAuth } from '@/test/auth';
import { charactersDocument, makeCharacter } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { TestProviders } from '@/test/providers';
import { createTestQueryClient, fakeUser } from '@/test/render';

import { ClearUserDataOnSignOut } from './clear-user-data-on-sign-out';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn(() => 'undo-toast'), dismiss: vi.fn() },
}));

const SKIRK = 'skirk' as CharacterId;
const ESCOFFIER = 'escoffier' as CharacterId;

beforeEach(() => {
  useCollectionStore.getState().clearCharacters();
  useTeamStore.getState().resetTeams();
  vi.clearAllMocks();
});

/** Auth arrives through `auth.current`, so a test can change it between `rerender()` calls. */
function appWrapper(auth: { current: AuthState }) {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <TestProviders queryClient={queryClient} auth={auth.current}>
        <ClearUserDataOnSignOut />
        {children}
      </TestProviders>
    );
  };
}

describe('ClearUserDataOnSignOut', () => {
  it("keeps a visitor's work while auth settles and across page changes", () => {
    useTeamStore.getState().assignCharacter(1, 0, SKIRK);

    const auth: { current: AuthState } = { current: { status: 'loading' } };
    const wrapper = appWrapper(auth);
    const usePages = () => {
      useCollection();
      useTeams();
    };

    const { rerender, unmount } = renderHook(usePages, { wrapper });
    auth.current = settledAuth(null);
    rerender();
    unmount();
    renderHook(usePages, { wrapper });

    expect(useTeamStore.getState().teams[1].members[0]?.characterId).toBe(SKIRK);
  });

  it('clears on sign-out, even off the pages that show the data, so the next user starts fresh', async () => {
    let serverCharacters = charactersDocument([makeCharacter(SKIRK)]);
    server.use(
      http.get('http://localhost:8080/characters', () => HttpResponse.json(serverCharacters)),
    );

    const auth = { current: settledAuth(fakeUser('user-1')) };
    const wrapper = appWrapper(auth);

    const { result: firstUser, unmount } = renderHook(() => useCollection(), { wrapper });
    await waitFor(() => expect(firstUser.current.getCharacter(SKIRK)).toBeDefined());
    unmount();

    // Signed out on another page, where none of the hooks is mounted.
    useTeamStore.getState().assignCharacter(1, 0, SKIRK);
    const { rerender, unmount: leave } = renderHook(() => null, { wrapper });
    auth.current = settledAuth(null);
    rerender();

    expect(useCollectionStore.getState().characters).toEqual({});
    expect(useTeamStore.getState().teams[1].members[0]).toBeNull();

    serverCharacters = charactersDocument([makeCharacter(ESCOFFIER, { constellationLevel: 2 })]);
    auth.current = settledAuth(fakeUser('user-2'));
    leave();
    const { result } = renderHook(() => useCollection(), { wrapper });

    await waitFor(() => expect(result.current.getCharacter(ESCOFFIER)?.constellationLevel).toBe(2));
    expect(result.current.getCharacter(SKIRK)).toBeUndefined();
  });

  it("withdraws the previous user's undo offers, so an undo can't restore into the next account", async () => {
    server.use(
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(SKIRK)])),
      ),
      http.delete(
        'http://localhost:8080/characters/skirk',
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    const auth = { current: settledAuth(fakeUser('user-1')) };
    const { result, rerender } = renderHook(() => useCollection(), {
      wrapper: appWrapper(auth),
    });
    await waitFor(() => expect(result.current.getCharacter(SKIRK)).toBeDefined());

    act(() => {
      result.current.removeCharacter(SKIRK);
    });
    await waitFor(() => expect(toast.success).toHaveBeenCalled());

    auth.current = settledAuth(null);
    rerender();

    expect(toast.dismiss).toHaveBeenCalledWith('undo-toast');
  });
});
