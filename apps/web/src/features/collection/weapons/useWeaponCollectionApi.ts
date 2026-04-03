// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import { deserialiseWeapon, MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

import type { WeaponInstance, WeaponInstanceId } from './useWeaponCollectionStore';

type WeaponRecord = Record<WeaponInstanceId, WeaponInstance>;

export interface WeaponMutationResult {
  instance: WeaponInstance;
}

export function weaponCollectionKey(userId: string): readonly [string, string] {
  return ['weapons', userId] as const;
}

export function parseWeaponCollectionResponse(response: unknown): WeaponRecord {
  assertCollectionDocument(response);
  const record: WeaponRecord = {};

  for (const item of response.collection.items) {
    const weapon = deserialiseWeapon(item);
    record[weapon.weaponInstanceId] = {
      weaponInstanceId: weapon.weaponInstanceId,
      weaponId: weapon.weaponId,
      refinementLevel: weapon.refinementLevel,
    };
  }

  return record;
}

function parseSingleWeaponResponse(response: unknown): WeaponMutationResult {
  assertCollectionDocument(response);
  if (response.collection.items.length !== 1) {
    throw new Error(
      `Invalid API response: expected exactly one item, got ${response.collection.items.length}`,
    );
  }
  const weapon = deserialiseWeapon(response.collection.items[0]);
  return {
    instance: {
      weaponInstanceId: weapon.weaponInstanceId,
      weaponId: weapon.weaponId,
      refinementLevel: weapon.refinementLevel,
    },
  };
}

export function useWeaponCollectionQuery(userId: string | undefined) {
  return useQuery({
    queryKey: weaponCollectionKey(userId ?? ''),
    queryFn: async () => {
      const response = await apiGet('/api/weapons');
      return parseWeaponCollectionResponse(response);
    },
    enabled: userId !== undefined,
  });
}

export function useAddWeaponMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weaponId: string): Promise<WeaponMutationResult> => {
      const response = await apiPost('/api/weapons', {
        weaponId,
        refinementLevel: MIN_REFINEMENT_LEVEL,
      });
      return parseSingleWeaponResponse(response);
    },
    onSuccess: () => {
      if (userId !== undefined)
        queryClient.invalidateQueries({ queryKey: weaponCollectionKey(userId) });
    },
  });
}

export function useRemoveWeaponMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (weaponInstanceId: WeaponInstanceId) => {
      await apiDelete(`/api/weapons/${encodeURIComponent(weaponInstanceId)}`);
    },
    onSuccess: () => {
      if (userId !== undefined)
        queryClient.invalidateQueries({ queryKey: weaponCollectionKey(userId) });
    },
  });
}

export function useSetRefinementLevelMutation(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      weaponInstanceId,
      level,
    }: {
      weaponInstanceId: WeaponInstanceId;
      level: number;
    }): Promise<WeaponMutationResult> => {
      const response = await apiPatch(`/api/weapons/${encodeURIComponent(weaponInstanceId)}`, {
        refinementLevel: level,
      });
      return parseSingleWeaponResponse(response);
    },
    onSuccess: () => {
      if (userId !== undefined)
        queryClient.invalidateQueries({ queryKey: weaponCollectionKey(userId) });
    },
  });
}
