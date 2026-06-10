// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertUserProfile, type ProfileResponse, type ProfileUpdate } from '@genshin/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPatch } from '@/lib/api';

import { useAuth } from './use-auth';

export function profileKey(userId: string): readonly [string, string] {
  return ['profile', userId] as const;
}

/**
 * Validate an unknown value against the composite GET /api/profile contract.
 *
 * The auth-owned half is checked field by field; the profile-owned half
 * (name and timestamps) reuses the shared `assertUserProfile` guard so the
 * validation stays in lockstep with the domain definition.
 */
export function assertProfileResponse(value: unknown): asserts value is ProfileResponse {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`ProfileResponse must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj.uid !== 'string') {
    throw new TypeError(`ProfileResponse.uid must be a string, got: ${JSON.stringify(obj.uid)}`);
  }
  if (obj.email !== null && typeof obj.email !== 'string') {
    throw new TypeError(
      `ProfileResponse.email must be a string or null, got: ${JSON.stringify(obj.email)}`,
    );
  }
  if (typeof obj.emailVerified !== 'boolean') {
    throw new TypeError(
      `ProfileResponse.emailVerified must be a boolean, got: ${JSON.stringify(obj.emailVerified)}`,
    );
  }
  if (obj.picture != null && typeof obj.picture !== 'string') {
    throw new TypeError(
      `ProfileResponse.picture must be a string, null, or absent, got: ${JSON.stringify(obj.picture)}`,
    );
  }
  assertUserProfile({ name: obj.name, createdAt: obj.createdAt, updatedAt: obj.updatedAt });
}

export function useProfileQuery() {
  const { user } = useAuth();
  const uid = user?.uid;

  return useQuery({
    queryKey: profileKey(uid ?? ''),
    queryFn: async (): Promise<ProfileResponse> => {
      const response = await apiGet('/api/profile');
      assertProfileResponse(response);
      return response;
    },
    enabled: uid !== undefined,
  });
}

export function useUpdateProfileMutation() {
  const { user } = useAuth();
  const uid = user?.uid;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: ProfileUpdate): Promise<ProfileResponse> => {
      const response = await apiPatch('/api/profile', update);
      assertProfileResponse(response);
      return response;
    },
    onSuccess: (profile) => {
      if (uid !== undefined) queryClient.setQueryData(profileKey(uid), profile);
    },
  });
}
