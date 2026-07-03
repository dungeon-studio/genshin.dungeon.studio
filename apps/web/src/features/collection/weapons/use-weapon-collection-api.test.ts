// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId } from '@genshin/domain';
import { MIN_REFINEMENT_LEVEL } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { makeWeapon, weaponsDocument } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper } from '@/test/render';

import {
  useAddWeaponMutation,
  useRemoveWeaponMutation,
  useSetRefinementLevelMutation,
  useWeaponCollectionQuery,
} from './use-weapon-collection-api';

const USER_ID = 'user-1';
const WEAPON_ID = 'angelos-heptades';
const INSTANCE_ID = 'weapon-instance-1' as CollectionWeaponId;

describe('useWeaponCollectionQuery', () => {
  it('returns the deserialised weapons keyed by instance id', async () => {
    server.use(
      http.get('http://localhost:8080/api/weapons', () =>
        HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 3)])),
      ),
    );

    const { result } = renderHook(() => useWeaponCollectionQuery(USER_ID), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.[INSTANCE_ID]).toEqual(
      expect.objectContaining({ weaponId: WEAPON_ID, refinementLevel: 3 }),
    );
  });
});

describe('useAddWeaponMutation', () => {
  it('POSTs the weapon id at the minimum refinement level', async () => {
    let postBody: unknown;
    server.use(
      http.post('http://localhost:8080/api/weapons', async ({ request }) => {
        postBody = await request.json();
        return HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 1)]));
      }),
    );

    const { result } = renderHook(() => useAddWeaponMutation(USER_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(WEAPON_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(postBody).toEqual({ weaponId: WEAPON_ID, refinementLevel: MIN_REFINEMENT_LEVEL });
    expect(result.current.data?.weapon.weaponInstanceId).toBe(INSTANCE_ID);
  });

  it('invalidates the collection query so it refetches after adding', async () => {
    let getCount = 0;
    server.use(
      http.get('http://localhost:8080/api/weapons', () => {
        getCount += 1;
        return HttpResponse.json(weaponsDocument([]));
      }),
      http.post('http://localhost:8080/api/weapons', () =>
        HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 1)])),
      ),
    );

    const { result } = renderHook(
      () => ({ query: useWeaponCollectionQuery(USER_ID), add: useAddWeaponMutation(USER_ID) }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true));
    expect(getCount).toBe(1);

    act(() => {
      result.current.add.mutate(WEAPON_ID);
    });

    await waitFor(() => expect(getCount).toBe(2));
  });
});

describe('useRemoveWeaponMutation', () => {
  it('sends a DELETE to the instance path', async () => {
    let deleted = false;
    server.use(
      http.delete('http://localhost:8080/api/weapons/weapon-instance-1', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useRemoveWeaponMutation(USER_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate(INSTANCE_ID);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleted).toBe(true);
  });
});

describe('useSetRefinementLevelMutation', () => {
  it('PATCHes the requested refinement level and returns the parsed weapon', async () => {
    let patchBody: unknown;
    server.use(
      http.patch('http://localhost:8080/api/weapons/weapon-instance-1', async ({ request }) => {
        patchBody = await request.json();
        return HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 5)]));
      }),
    );

    const { result } = renderHook(() => useSetRefinementLevelMutation(USER_ID), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({ collectionWeaponId: INSTANCE_ID, level: 5 });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(patchBody).toEqual({ refinementLevel: 5 });
    expect(result.current.data?.weapon.refinementLevel).toBe(5);
  });
});
