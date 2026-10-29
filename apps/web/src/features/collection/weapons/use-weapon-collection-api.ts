// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * The weapon collection's TanStack Query layer, wrapping the raw HTTP calls.
 *
 * Query keys are scoped by user ID, so signing in as someone else never serves
 * the previous account's cached instances. Every mutation invalidates that key
 * rather than writing into the cache, because the server mints the instance
 * identifier and decides the stored timestamps.
 *
 * `useWeaponCollection` is what a component reaches for; these are its parts.
 */

import type { Item } from '@genshin/collection-json';
import { assertCollectionDocument } from '@genshin/collection-json';
import type { CollectionWeapon, CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import { deserialiseWeapon, MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';

import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { apiGetAllItems } from '@/lib/api-collection';
import { useUserQuerySync } from '@/lib/use-user-query-sync';
import { userScopedKey } from '@/lib/user-scoped-key';

type WeaponRecord = Record<CollectionWeaponId, CollectionWeapon>;

export interface WeaponMutationResult {
  weapon: CollectionWeapon;
}

const weaponsKey = userScopedKey('weapons');

function toWeaponRecord(items: Item[]): WeaponRecord {
  const record: WeaponRecord = {};

  for (const item of items) {
    const weapon = deserialiseWeapon(item);
    record[weapon.weaponInstanceId] = weapon;
  }

  return record;
}

function parseSingleWeaponResponse(response: unknown): WeaponMutationResult {
  assertCollectionDocument(response);
  const { items } = response.collection;
  const [item] = items;
  if (items.length !== 1 || item === undefined) {
    throw new Error(`Invalid API response: expected exactly one item, got ${items.length}`);
  }
  const weapon = deserialiseWeapon(item);
  return { weapon };
}

export function useWeaponCollectionQuery(
  userId: string | undefined,
): UseQueryResult<WeaponRecord, Error> {
  return useQuery({
    queryKey: weaponsKey(userId ?? ''),
    queryFn: async () => {
      return toWeaponRecord(await apiGetAllItems('/weapons'));
    },
    enabled: userId !== undefined,
  });
}

export interface AddWeaponVariables {
  weaponId: string;
  /** Defaults to the minimum, as a newly obtained copy has. */
  refinementLevel?: RefinementLevel;
}

export function useAddWeaponMutation(
  userId: string | undefined,
): UseMutationResult<WeaponMutationResult, Error, AddWeaponVariables> {
  const querySync = useUserQuerySync(userId, weaponsKey);

  return useMutation({
    mutationFn: async ({
      weaponId,
      refinementLevel = MIN_REFINEMENT_LEVEL,
    }: AddWeaponVariables): Promise<WeaponMutationResult> => {
      const response = await apiPost('/weapons', { weaponId, refinementLevel });
      return parseSingleWeaponResponse(response);
    },
    ...querySync,
  });
}

export function useRemoveWeaponMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, CollectionWeaponId> {
  const querySync = useUserQuerySync(userId, weaponsKey);

  return useMutation({
    mutationFn: async (collectionWeaponId: CollectionWeaponId) => {
      await apiDelete(`/weapons/${encodeURIComponent(collectionWeaponId)}`);
    },
    ...querySync,
  });
}

export interface SetRefinementLevelVariables {
  collectionWeaponId: CollectionWeaponId;
  level: RefinementLevel;
}

export function useSetRefinementLevelMutation(
  userId: string | undefined,
): UseMutationResult<WeaponMutationResult, Error, SetRefinementLevelVariables> {
  const querySync = useUserQuerySync(userId, weaponsKey);

  return useMutation({
    mutationFn: async ({
      collectionWeaponId,
      level,
    }: SetRefinementLevelVariables): Promise<WeaponMutationResult> => {
      const response = await apiPatch(`/weapons/${encodeURIComponent(collectionWeaponId)}`, {
        refinementLevel: level,
      });
      return parseSingleWeaponResponse(response);
    },
    ...querySync,
  });
}
