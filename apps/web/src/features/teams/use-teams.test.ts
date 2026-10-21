// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeamMembers } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTeam, teamsDocument } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createTestQueryClient, createWrapper, fakeUser } from '@/test/render';

import { useTeamStore } from './use-team-store';
import { useTeams } from './use-teams';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const CHARACTER = 'skirk';
const MEMBERS: CollectionTeamMembers = [{ characterId: CHARACTER }, null, null, null];

beforeEach(() => {
  useTeamStore.getState().resetTeams();
  vi.clearAllMocks();
});

describe('useTeams (authenticated)', () => {
  it('rolls back an optimistic assignment when the save fails', async () => {
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([]))),
      http.put('http://localhost:8080/teams/1', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useTeams(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });

    // Optimistic update is visible immediately, before the save resolves.
    expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER);

    // Save fails, so the member is reverted and the user is notified.
    await waitFor(() => expect(result.current.getTeam(1).members[0]).toBeNull());
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });

  it('restores a cleared team when the delete fails', async () => {
    server.use(
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { members: MEMBERS })])),
      ),
      http.delete('http://localhost:8080/teams/1', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useTeams(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER));

    act(() => {
      result.current.clearTeam(1);
    });

    // Optimistically emptied, then restored once the delete errors.
    expect(result.current.getTeam(1).members[0]).toBeNull();
    await waitFor(() => expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });

  it('warns before unload while a save is in flight', async () => {
    let releasePut: () => void = () => {};
    const putGate = new Promise<void>((resolve) => {
      releasePut = resolve;
    });
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([]))),
      http.put('http://localhost:8080/teams/1', async () => {
        await putGate;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useTeams(), {
      wrapper: createWrapper({ user: fakeUser('user-1') }),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });
    await waitFor(() => expect(result.current.isSaving).toBe(true));

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);

    // Let the in-flight save settle so no request outlives the test.
    releasePut();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });

  it('keeps an edit that a refetch started before it would overwrite', async () => {
    let releaseRefetch: () => void = () => {};
    const refetchGate = new Promise<void>((resolve) => {
      releaseRefetch = resolve;
    });
    let releaseSecondPut: () => void = () => {};
    const secondPutGate = new Promise<void>((resolve) => {
      releaseSecondPut = resolve;
    });
    let gets = 0;
    const putBodies: { members: CollectionTeamMembers }[] = [];
    server.use(
      http.get('http://localhost:8080/teams', async () => {
        gets += 1;
        if (gets === 1) return HttpResponse.json(teamsDocument([]));
        // Answers with the server's state from before the second edit.
        await refetchGate;
        return HttpResponse.json(teamsDocument([makeTeam(1, { name: 'First' })]));
      }),
      http.put('http://localhost:8080/teams/1', async ({ request }) => {
        putBodies.push((await request.json()) as { members: CollectionTeamMembers });
        if (putBodies.length === 2) await secondPutGate;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const queryClient = createTestQueryClient();
    const { result } = renderHook(() => useTeams(), {
      wrapper: createWrapper({ user: fakeUser('user-1'), queryClient }),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setTeamName(1, 'First');
    });
    await waitFor(() => expect(gets).toBe(2));

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });
    await waitFor(() => expect(putBodies).toHaveLength(2));

    releaseRefetch();
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));

    act(() => {
      result.current.setTeamName(1, 'Third');
    });
    await waitFor(() => expect(putBodies).toHaveLength(3));
    expect(putBodies[2]?.members[0]?.characterId).toBe(CHARACTER);

    releaseSecondPut();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });
});

describe('useTeams (local-only)', () => {
  it('applies assignments to the store without calling the API', () => {
    // No handlers: any request would trip the unhandled-request guard.
    const { result } = renderHook(() => useTeams(), {
      wrapper: createWrapper({ user: null }),
    });

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });

    expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER);
    expect(result.current.isSaving).toBe(false);
  });
});
