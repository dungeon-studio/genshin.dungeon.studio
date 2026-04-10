// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import type { CollectionTeam, CollectionTeamMember, TeamSlot } from '@genshin/domain';
import { deserialiseTeam } from '@genshin/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPut } from '@/lib/api';

export interface SaveTeamPayload {
  slot: TeamSlot;
  name: string;
  members: (CollectionTeamMember | null)[];
  description?: string;
}

export function teamKey(userId: string): readonly [string, string] {
  return ['teams', userId] as const;
}

export function parseTeamsResponse(response: unknown): CollectionTeam[] {
  assertCollectionDocument(response);
  return response.collection.items.map((item) => deserialiseTeam(item));
}

export function useTeamsQuery(userId: string | undefined) {
  return useQuery({
    queryKey: teamKey(userId ?? ''),
    queryFn: async () => {
      const response = await apiGet('/api/teams');
      return parseTeamsResponse(response);
    },
    enabled: userId !== undefined,
  });
}

export function useSaveTeamMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ slot, name, members, description }: SaveTeamPayload) => {
      await apiPut(`/api/teams/${encodeURIComponent(slot)}`, { name, members, description });
    },
    onSuccess: () => {
      if (userId !== undefined) queryClient.invalidateQueries({ queryKey: teamKey(userId) });
    },
  });
}

export function useDeleteTeamMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slot: TeamSlot) => {
      await apiDelete(`/api/teams/${encodeURIComponent(slot)}`);
    },
    onSuccess: () => {
      if (userId !== undefined) queryClient.invalidateQueries({ queryKey: teamKey(userId) });
    },
  });
}
