// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWeapon, weaponsDocument } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

import { useWeaponCollection } from './use-weapon-collection';
import { useWeaponCollectionStore } from './use-weapon-collection-store';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const WEAPON_ID = 'angelos-heptades';
const INSTANCE_ID = 'weapon-instance-1' as CollectionWeaponId;

beforeEach(() => {
  useWeaponCollectionStore.getState().clearWeapons();
  vi.clearAllMocks();
});

function renderAuthed() {
  return renderHook(() => useWeaponCollection(), {
    wrapper: createWrapper({ user: fakeUser('user-1') }),
  });
}

describe('useWeaponCollection', () => {
  it('adds the server-confirmed weapon to the store', async () => {
    let serverWeapons = weaponsDocument([]);
    server.use(
      http.get('http://localhost:8080/api/weapons', () => HttpResponse.json(serverWeapons)),
      http.post('http://localhost:8080/api/weapons', () => {
        serverWeapons = weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 1)]);
        return HttpResponse.json(serverWeapons);
      }),
    );

    const { result } = renderAuthed();
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.addWeapon(WEAPON_ID);
    });

    await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.weaponId).toBe(WEAPON_ID));
  });

  it('restores a removed weapon when the delete fails', async () => {
    server.use(
      http.get('http://localhost:8080/api/weapons', () =>
        HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 2)])),
      ),
      http.delete(
        'http://localhost:8080/api/weapons/weapon-instance-1',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderAuthed();
    await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

    act(() => {
      result.current.removeWeapon(INSTANCE_ID);
    });

    // Optimistically gone, then restored once the delete errors.
    expect(result.current.weapons[INSTANCE_ID]).toBeUndefined();
    await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });

  it('reverts a refinement change when the update fails', async () => {
    server.use(
      http.get('http://localhost:8080/api/weapons', () =>
        HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, 2)])),
      ),
      http.patch(
        'http://localhost:8080/api/weapons/weapon-instance-1',
        () => new HttpResponse(null, { status: 500 }),
      ),
    );

    const { result } = renderAuthed();
    await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(2));

    act(() => {
      result.current.setRefinementLevel(INSTANCE_ID, 5);
    });

    expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(5);
    await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(2));
    expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('reverted'));
  });
});
