// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, CollectionTeamMembers, ISOTimestamp } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeTeam, teamsDocument } from '@/test/fixtures';
import { holdResponse } from '@/test/msw/held-response';
import { matchJsonBody } from '@/test/msw/match-json-body';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser, renderHookSignedIn } from '@/test/render';

import { useTeamStore } from './use-team-store';
import { useTeams } from './use-teams';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const CHARACTER = 'skirk';
const MEMBERS: CollectionTeamMembers = [{ characterId: CHARACTER }, null, null, null];
const SAVED_AT = '2026-04-01T00:00:00.000Z' as ISOTimestamp;

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
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't save Team 1. Position 1 is empty again. Try again.",
    );
  });

  it('names the character a failed removal brings back', async () => {
    server.use(
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { members: MEMBERS })])),
      ),
      http.put('http://localhost:8080/teams/1', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHookSignedIn(() => useTeams(), 'user-1');
    await waitFor(() => expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER));

    act(() => {
      result.current.removeCharacter(1, 0);
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't save Team 1. Skirk is back in position 1. Try again.",
      ),
    );
    expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER);
  });

  it.each<[string, (teams: ReturnType<typeof useTeams>) => void, string]>([
    [
      'a weapon removal',
      (teams) => teams.removeWeapon(1, 0),
      "Skirk's weapon is back to how it was.",
    ],
    [
      'an artifact plan change',
      (teams) => teams.setArtifactPlan(1, 0, undefined),
      "Skirk's artifact plan is back to how it was.",
    ],
    ['a rename', (teams) => teams.setTeamName(1, 'Freeze'), 'The team is named Team 1 again.'],
    ['a clear', (teams) => teams.clearTeam(1), 'Its members are back.'],
  ])('says what a failed save of %s puts back', async (_, edit, reverted) => {
    server.use(
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { members: MEMBERS })])),
      ),
      http.put('http://localhost:8080/teams/1', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHookSignedIn(() => useTeams(), 'user-1');
    await waitFor(() => expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER));

    act(() => {
      edit(result.current);
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(`Couldn't save Team 1. ${reverted} Try again.`),
    );
  });

  it('saves a renamed team', async () => {
    let putBody: unknown;
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([]))),
      http.put('http://localhost:8080/teams/1', async ({ request }) => {
        putBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHookSignedIn(() => useTeams(), 'user-1');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setTeamName(1, 'Abyss');
    });

    await waitFor(() => expect(putBody).toMatchObject({ name: 'Abyss' }));
  });

  it("keeps a cleared team's name after the refetch", async () => {
    let stored = makeTeam(1, { name: 'Abyss', members: MEMBERS });
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([stored]))),
      http.put('http://localhost:8080/teams/1', async ({ request }) => {
        const body = (await request.json()) as Pick<typeof stored, 'name' | 'members'>;
        stored = makeTeam(1, { name: body.name, members: body.members, updatedAt: SAVED_AT });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHookSignedIn(() => useTeams(), 'user-1');

    await waitFor(() => expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER));

    act(() => {
      result.current.clearTeam(1);
    });

    // The server's timestamp marks the refetch landing in the store.
    await waitFor(() => expect(result.current.getTeam(1).updatedAt).toBe(SAVED_AT));
    expect(result.current.getTeam(1).members[0]).toBeNull();
    expect(result.current.getTeam(1).name).toBe('Abyss');
  });

  it('rolls back a failed save while another team saves', async () => {
    const firstPut = holdResponse(() => new HttpResponse(null, { status: 500 }));
    const saved: CollectionTeam[] = [];
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument(saved))),
      http.put('http://localhost:8080/teams/1', firstPut.resolver),
      http.put('http://localhost:8080/teams/2', () => {
        saved.push(makeTeam(2, { members: MEMBERS }));
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHookSignedIn(() => useTeams(), 'user-1');
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });
    act(() => {
      result.current.assignCharacter(2, 0, CHARACTER);
    });

    firstPut.release();
    await waitFor(() => expect(result.current.getTeam(1).members[0]).toBeNull());
    expect(result.current.getTeam(2).members[0]?.characterId).toBe(CHARACTER);
    expect(toast.error).toHaveBeenCalledWith(
      "Couldn't save Team 1. Position 1 is empty again. Try again.",
    );
  });

  it('reports a failed save that a newer edit to the same team superseded', async () => {
    const firstPut = holdResponse(() => new HttpResponse(null, { status: 500 }));
    const newerName = 'Newer';
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([]))),
      http.put(
        matchJsonBody<{ name: string }>(
          'http://localhost:8080/teams/1',
          ({ name }) => name !== newerName,
        ),
        firstPut.resolver,
      ),
      http.put('http://localhost:8080/teams/1', () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHookSignedIn(() => useTeams(), 'user-1');
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });
    act(() => {
      result.current.setTeamName(1, newerName);
    });
    await act(() => firstPut.arrived);

    firstPut.release();
    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Couldn't save Team 1. Your newer change stands."),
    );
    expect(result.current.getTeam(1).name).toBe(newerName);
    expect(result.current.getTeam(1).members[0]?.characterId).toBe(CHARACTER);
  });

  it('warns before unload while a save is in flight', async () => {
    const put = holdResponse(() => new HttpResponse(null, { status: 204 }));
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([]))),
      http.put('http://localhost:8080/teams/1', put.resolver),
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
    put.release();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });

  it('keeps an edit that a refetch started before it would overwrite', async () => {
    // Answers with the server's state from before the second edit.
    const staleRefetch = holdResponse(() =>
      HttpResponse.json(teamsDocument([makeTeam(1, { name: 'First' })])),
    );
    const secondPut = holdResponse(() => new HttpResponse(null, { status: 204 }));
    const putBodies: { members: CollectionTeamMembers }[] = [];
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([])), {
        once: true,
      }),
      http.get('http://localhost:8080/teams', staleRefetch.resolver, { once: true }),
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { name: 'Third', members: MEMBERS })])),
      ),
      http.put('http://localhost:8080/teams/1', async ({ request }) => {
        putBodies.push((await request.json()) as { members: CollectionTeamMembers });
        if (putBodies.length === 2) return secondPut.resolver();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result, queryClient } = renderHookSignedIn(() => useTeams(), 'user-1');
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.setTeamName(1, 'First');
    });
    await waitFor(() => expect(queryClient.isFetching()).toBe(1));

    act(() => {
      result.current.assignCharacter(1, 0, CHARACTER);
    });
    await waitFor(() => expect(putBodies).toHaveLength(2));

    staleRefetch.release();
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));

    act(() => {
      result.current.setTeamName(1, 'Third');
    });
    await waitFor(() => expect(putBodies).toHaveLength(3));
    expect(putBodies[2]?.members[0]?.characterId).toBe(CHARACTER);

    secondPut.release();
    await waitFor(() => expect(result.current.isSaving).toBe(false));
  });

  it('keeps an edit made after a refetch answers but before it renders', async () => {
    const secondPut = holdResponse(() => new HttpResponse(null, { status: 204 }));
    const putBodies: { members: CollectionTeamMembers }[] = [];
    server.use(
      http.get('http://localhost:8080/teams', () => HttpResponse.json(teamsDocument([])), {
        once: true,
      }),
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { name: 'First' })])),
      ),
      http.put('http://localhost:8080/teams/1', async ({ request }) => {
        putBodies.push((await request.json()) as { members: CollectionTeamMembers });
        if (putBodies.length === 2) return secondPut.resolver();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result, queryClient } = renderHookSignedIn(() => useTeams(), 'user-1');
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // A cache listener runs before React renders the answer, so this edit
    // lands in between.
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.action.type !== 'success') return;
      if (putBodies.length !== 1) return;
      act(() => {
        result.current.assignCharacter(1, 0, CHARACTER);
      });
    });

    act(() => {
      result.current.setTeamName(1, 'First');
    });
    await waitFor(() => expect(putBodies).toHaveLength(2));
    unsubscribe();

    act(() => {
      result.current.setTeamName(1, 'Third');
    });
    await waitFor(() => expect(putBodies).toHaveLength(3));
    expect(putBodies[2]?.members[0]?.characterId).toBe(CHARACTER);

    secondPut.release();
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
