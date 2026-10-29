// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * The weapon collection's TanStack Query layer, wrapping the raw HTTP calls.
 *
 * Query keys are scoped by user ID, so signing in as someone else never serves
 * the previous account's cached instances. The cache is the collection's only
 * client-side copy.
 *
 * Removes and refinement changes write into the cache before the server
 * answers. A rejected one puts back what it replaced, unless a newer write has
 * since changed that instance. Adds can't be optimistic, because the server
 * mints the instance identifier. Every write still invalidates the key once it
 * succeeds, because the server decides the stored timestamps.
 *
 * `useWeaponCollection` is what a component reaches for; these are its parts.
 */

import type { Item } from '@genshin/collection-json';
import { assertCollectionDocument } from '@genshin/collection-json';
import type { CollectionWeapon, CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import { deserialiseWeapon } from '@genshin/domain';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { apiGetAllItems } from '@/lib/api-collection';
import { useUserQuerySync } from '@/lib/use-user-query-sync';
import { userScopedKey } from '@/lib/user-scoped-key';

type WeaponRecord = Record<CollectionWeaponId, CollectionWeapon>;

export interface WeaponMutationResult {
  weapon: CollectionWeapon;
}

const weaponsKey = userScopedKey('weapons');

/** The cached collection of one user, read at call time. */
export interface WeaponCache {
  read: () => WeaponRecord;
  /** Changes a loaded collection; one still loading is left to its first fetch. */
  update: (change: (weapons: WeaponRecord) => WeaponRecord) => void;
}

export function useWeaponCache(userId: string | undefined): WeaponCache {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const queryKey = weaponsKey(userId ?? '');
    return {
      read: () => queryClient.getQueryData<WeaponRecord>(queryKey) ?? {},
      update: (change) => {
        queryClient.setQueryData<WeaponRecord>(queryKey, (weapons) => weapons && change(weapons));
      },
    };
  }, [queryClient, userId]);
}

function withWeapon(weapon: CollectionWeapon): (weapons: WeaponRecord) => WeaponRecord {
  return (weapons) => ({ ...weapons, [weapon.weaponInstanceId]: weapon });
}

function withoutWeapon(
  collectionWeaponId: CollectionWeaponId,
): (weapons: WeaponRecord) => WeaponRecord {
  return (weapons) => {
    const rest = { ...weapons };
    delete rest[collectionWeaponId];
    return rest;
  };
}

/** What an optimistic edit replaced, for putting back if the server rejects it. */
export interface WeaponEditContext {
  previous: CollectionWeapon | undefined;
}

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
  refinementLevel: RefinementLevel;
}

export function useAddWeaponMutation(
  userId: string | undefined,
): UseMutationResult<WeaponMutationResult, Error, AddWeaponVariables> {
  const querySync = useUserQuerySync(userId, weaponsKey);
  const cache = useWeaponCache(userId);

  return useMutation({
    mutationFn: async ({
      weaponId,
      refinementLevel,
    }: AddWeaponVariables): Promise<WeaponMutationResult> => {
      const response = await apiPost('/weapons', { weaponId, refinementLevel });
      return parseSingleWeaponResponse(response);
    },
    ...querySync,
    onSuccess: ({ weapon }) => {
      cache.update(withWeapon(weapon));
      querySync.onSuccess();
    },
  });
}

export function useRemoveWeaponMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, CollectionWeaponId, WeaponEditContext> {
  const querySync = useUserQuerySync(userId, weaponsKey);
  const cache = useWeaponCache(userId);

  return useMutation({
    mutationFn: async (collectionWeaponId: CollectionWeaponId) => {
      await apiDelete(`/weapons/${encodeURIComponent(collectionWeaponId)}`);
    },
    ...querySync,
    onMutate: async (collectionWeaponId) => {
      await querySync.onMutate();
      const previous = cache.read()[collectionWeaponId];
      cache.update(withoutWeapon(collectionWeaponId));
      return { previous };
    },
    onError: (_error, collectionWeaponId, context) => {
      const previous = context?.previous;
      if (!previous || collectionWeaponId in cache.read()) return;
      cache.update(withWeapon(previous));
    },
  });
}

export interface SetRefinementLevelVariables {
  collectionWeaponId: CollectionWeaponId;
  level: RefinementLevel;
}

export function useSetRefinementLevelMutation(
  userId: string | undefined,
): UseMutationResult<WeaponMutationResult, Error, SetRefinementLevelVariables, WeaponEditContext> {
  const querySync = useUserQuerySync(userId, weaponsKey);
  const cache = useWeaponCache(userId);

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
    onMutate: async ({ collectionWeaponId, level }) => {
      await querySync.onMutate();
      const previous = cache.read()[collectionWeaponId];
      if (previous) cache.update(withWeapon({ ...previous, refinementLevel: level }));
      return { previous };
    },
    onError: (_error, { collectionWeaponId, level }, context) => {
      const previous = context?.previous;
      if (!previous || cache.read()[collectionWeaponId]?.refinementLevel !== level) return;
      cache.update(withWeapon(previous));
    },
    onSuccess: ({ weapon }) => {
      cache.update(withWeapon(weapon));
      querySync.onSuccess();
    },
  });
}
