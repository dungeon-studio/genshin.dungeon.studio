// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * The weapon collection's TanStack Query layer, wrapping the raw HTTP calls.
 *
 * Query keys are scoped by user ID, so signing in as someone else never serves
 * the previous account's cached instances.
 *
 * Removes and refinement changes show in the cache before the server answers.
 * Adds wait for the response, because the server mints the instance
 * identifier. Every write invalidates the key once it settles, because the
 * server decides the stored timestamps.
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
import type { UserQuerySync } from '@/lib/use-user-query-sync';
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
  /**
   * Whether the cache matches `instance`, where `undefined` means absent. It
   * compares refinement only, the one field an edit changes.
   */
  holds: (
    collectionWeaponId: CollectionWeaponId,
    instance: CollectionWeapon | undefined,
  ) => boolean;
  /** Changes a loaded collection; one still loading is left to its first fetch. */
  update: (change: (weapons: WeaponRecord) => WeaponRecord) => void;
}

export function useWeaponCache(userId: string | undefined): WeaponCache {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const queryKey = weaponsKey(userId ?? '');
    const read = () => queryClient.getQueryData<WeaponRecord>(queryKey) ?? {};
    return {
      read,
      holds: (collectionWeaponId, instance) =>
        read()[collectionWeaponId]?.refinementLevel === instance?.refinementLevel,
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

/** What an optimistic edit replaced and what it wrote, for undoing a rejected one. */
export interface WeaponEditContext {
  previous: CollectionWeapon;
  optimistic: CollectionWeapon | undefined;
}

/**
 * Shows an edit to one instance before the server answers. `apply` returns the
 * edited instance, or `undefined` to remove it.
 *
 * A rejected edit puts back the replaced instance only while the cache still
 * holds the edit, so a newer edit to the same instance stands.
 */
function optimisticEdit<TVariables>(
  cache: WeaponCache,
  querySync: UserQuerySync,
  idOf: (variables: TVariables) => CollectionWeaponId,
  apply: (current: CollectionWeapon, variables: TVariables) => CollectionWeapon | undefined,
): {
  onMutate: (variables: TVariables) => Promise<WeaponEditContext | undefined>;
  onError: (error: Error, variables: TVariables, context: WeaponEditContext | undefined) => void;
} {
  return {
    onMutate: async (variables) => {
      await querySync.onMutate();
      const collectionWeaponId = idOf(variables);
      const previous = cache.read()[collectionWeaponId];
      if (!previous) return undefined;

      const optimistic = apply(previous, variables);
      cache.update(optimistic ? withWeapon(optimistic) : withoutWeapon(collectionWeaponId));
      return { previous, optimistic };
    },
    onError: (_error, variables, context) => {
      if (!context || !cache.holds(idOf(variables), context.optimistic)) return;
      cache.update(withWeapon(context.previous));
    },
  };
}

function storeConfirmed(cache: WeaponCache): (result: WeaponMutationResult) => void {
  return ({ weapon }) => {
    cache.update(withWeapon(weapon));
  };
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
    onSuccess: storeConfirmed(cache),
  });
}

export function useRemoveWeaponMutation(
  userId: string | undefined,
): UseMutationResult<void, Error, CollectionWeaponId, WeaponEditContext | undefined> {
  const querySync = useUserQuerySync(userId, weaponsKey);
  const cache = useWeaponCache(userId);

  return useMutation<void, Error, CollectionWeaponId, WeaponEditContext | undefined>({
    mutationFn: async (collectionWeaponId: CollectionWeaponId) => {
      await apiDelete(`/weapons/${encodeURIComponent(collectionWeaponId)}`);
    },
    ...querySync,
    ...optimisticEdit<CollectionWeaponId>(
      cache,
      querySync,
      (collectionWeaponId) => collectionWeaponId,
      () => undefined,
    ),
  });
}

export interface SetRefinementLevelVariables {
  collectionWeaponId: CollectionWeaponId;
  level: RefinementLevel;
}

export function useSetRefinementLevelMutation(
  userId: string | undefined,
): UseMutationResult<
  WeaponMutationResult,
  Error,
  SetRefinementLevelVariables,
  WeaponEditContext | undefined
> {
  const querySync = useUserQuerySync(userId, weaponsKey);
  const cache = useWeaponCache(userId);

  return useMutation<
    WeaponMutationResult,
    Error,
    SetRefinementLevelVariables,
    WeaponEditContext | undefined
  >({
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
    ...optimisticEdit<SetRefinementLevelVariables>(
      cache,
      querySync,
      ({ collectionWeaponId }) => collectionWeaponId,
      (current, { level }) => ({ ...current, refinementLevel: level }),
    ),
    onSuccess: storeConfirmed(cache),
  });
}
