// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * The team resource's TanStack Query layer, wrapping the raw HTTP calls.
 *
 * Query keys are scoped by user ID, so signing in as someone else never serves
 * the previous account's cached teams. Every mutation invalidates that key
 * rather than writing into the cache, because the server decides the stored
 * timestamps.
 *
 * `useTeams` is what a component reaches for; these are its parts.
 */

import type { CollectionTeam, CollectionTeamMembers, TeamSlot } from '@genshin/domain';
import { deserialiseTeam } from '@genshin/domain';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiPut } from '@/lib/api';
import { apiGetAllItems } from '@/lib/api-collection';
import { invalidateUserQuery } from '@/lib/invalidate-user-query';
import { userScopedKey } from '@/lib/user-scoped-key';

export interface SaveTeamPayload {
  slot: TeamSlot;
  name: string;
  members: CollectionTeamMembers;
  description?: string;
}

const teamsKey = userScopedKey('teams');

export function useTeamsQuery(userId: string | undefined): UseQueryResult<CollectionTeam[], Error> {
  return useQuery({
    queryKey: teamsKey(userId ?? ''),
    queryFn: async () => {
      const items = await apiGetAllItems('/teams');
      return items.map((item) => deserialiseTeam(item));
    },
    enabled: userId !== undefined,
  });
}

export function useSaveTeamMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, SaveTeamPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slot, name, members, description }: SaveTeamPayload) => {
      await apiPut(`/teams/${encodeURIComponent(slot)}`, { name, members, description });
    },
    onSuccess: invalidateUserQuery(queryClient, userId, teamsKey),
  });
}

export function useDeleteTeamMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, TeamSlot> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slot: TeamSlot) => {
      await apiDelete(`/teams/${encodeURIComponent(slot)}`);
    },
    onSuccess: invalidateUserQuery(queryClient, userId, teamsKey),
  });
}
