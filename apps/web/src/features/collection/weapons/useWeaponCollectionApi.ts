// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { assertCollectionDocument } from '@genshin/collection-json';
import type { CollectionWeapon, CollectionWeaponId } from '@genshin/domain';
import { deserialiseWeapon, MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';

type WeaponRecord = Record<CollectionWeaponId, CollectionWeapon>;

export interface WeaponMutationResult {
  weapon: CollectionWeapon;
}

export function weaponCollectionKey(userId: string): readonly [string, string] {
  return ['weapons', userId] as const;
}

export function parseWeaponCollectionResponse(response: unknown): WeaponRecord {
  assertCollectionDocument(response);
  const record: WeaponRecord = {};

  for (const item of response.collection.items) {
    const weapon = deserialiseWeapon(item);
    record[weapon.weaponInstanceId] = weapon;
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
  return { weapon };
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
    mutationFn: async (collectionWeaponId: CollectionWeaponId) => {
      await apiDelete(`/api/weapons/${encodeURIComponent(collectionWeaponId)}`);
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
      collectionWeaponId,
      level,
    }: {
      collectionWeaponId: CollectionWeaponId;
      level: number;
    }): Promise<WeaponMutationResult> => {
      const response = await apiPatch(`/api/weapons/${encodeURIComponent(collectionWeaponId)}`, {
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
