// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeamMembers } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeTeam, teamsDocument } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper } from '@/test/render';

import { useSaveTeamMutation, useTeamsQuery } from './use-team-api';

const USER_ID = 'user-1';
const EMPTY_MEMBERS: CollectionTeamMembers = [null, null, null, null];

describe('useTeamsQuery', () => {
  it('returns the deserialised teams from the collection document', async () => {
    server.use(
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { name: 'Alpha' })])),
      ),
    );

    const { result } = renderHook(() => useTeamsQuery(USER_ID), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([expect.objectContaining({ slot: 1, name: 'Alpha' })]);
  });

  it('stays disabled until a user id is provided', () => {
    const { result } = renderHook(() => useTeamsQuery(undefined), { wrapper: createWrapper() });

    // No handler is registered; a request would fail the unhandled-request guard.
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useSaveTeamMutation', () => {
  it('sends a PUT to the slot path with the team payload', async () => {
    let putBody: unknown;
    server.use(
      http.put('http://localhost:8080/teams/2', async ({ request }) => {
        putBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useSaveTeamMutation(USER_ID), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate({
        slot: 2,
        name: 'Bravo',
        members: EMPTY_MEMBERS,
        description: 'notes',
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(putBody).toEqual({ name: 'Bravo', members: EMPTY_MEMBERS, description: 'notes' });
  });

  it('invalidates the teams query so it refetches after a save', async () => {
    let getCount = 0;
    server.use(
      http.get('http://localhost:8080/teams', () => {
        getCount += 1;
        return HttpResponse.json(teamsDocument([makeTeam(1)]));
      }),
      http.put('http://localhost:8080/teams/1', () => new HttpResponse(null, { status: 204 })),
    );

    const { result } = renderHook(
      () => ({ query: useTeamsQuery(USER_ID), save: useSaveTeamMutation(USER_ID) }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(getCount).toBe(1);

    act(() => {
      result.current.save.mutate({ slot: 1, name: 'Alpha', members: EMPTY_MEMBERS });
    });

    await waitFor(() => expect(getCount).toBe(2));
  });
});
