// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWeapon, weaponsDocument } from '@/test/fixtures';
import { holdResponse } from '@/test/msw/held-response';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser, renderHookSignedIn } from '@/test/render';

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

const SECOND_INSTANCE_ID = 'weapon-instance-2' as CollectionWeaponId;

describe('useWeaponCollection', () => {
  describe('addWeapon', () => {
    it('adds the server-confirmed weapon to the store', async () => {
      let serverWeapons = weaponsDocument([]);
      server.use(
        http.get('http://localhost:8080/weapons', () => HttpResponse.json(serverWeapons)),
        http.post('http://localhost:8080/weapons', () => {
          serverWeapons = weaponsDocument([
            makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 }),
          ]);
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

    it('creates another instance even when the weapon is already owned', async () => {
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 })]),
          ),
        ),
        http.post('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(SECOND_INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 })]),
          ),
        ),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

      act(() => {
        result.current.addWeapon(WEAPON_ID);
      });

      await waitFor(() => expect(result.current.weapons[SECOND_INSTANCE_ID]).toBeDefined());
      expect(result.current.weapons[INSTANCE_ID]).toBeDefined();
    });

    it('leaves the store alone when the add settles after sign-out', async () => {
      const addConfirmation = holdResponse(() =>
        HttpResponse.json(
          weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 })]),
        ),
      );
      server.use(
        http.get('http://localhost:8080/weapons', () => HttpResponse.json(weaponsDocument([]))),
        http.post('http://localhost:8080/weapons', addConfirmation.resolver),
      );

      const { result, queryClient, signOut } = renderHookSignedIn(
        () => useWeaponCollection(),
        'user-1',
      );
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.addWeapon(WEAPON_ID);
      });
      signOut();
      await waitFor(() => expect(queryClient.isMutating()).toBe(1));
      addConfirmation.release();

      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(useWeaponCollectionStore.getState().weapons).toEqual({});
    });
  });

  describe('ensureWeapon', () => {
    it('creates only one instance when it fires repeatedly before the add lands', async () => {
      let posts = 0;
      let serverWeapons = weaponsDocument([]);
      server.use(
        http.get('http://localhost:8080/weapons', () => HttpResponse.json(serverWeapons)),
        http.post('http://localhost:8080/weapons', () => {
          posts += 1;
          serverWeapons = weaponsDocument([
            makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 }),
          ]);
          return HttpResponse.json(serverWeapons);
        }),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.ensureWeapon(WEAPON_ID);
        result.current.ensureWeapon(WEAPON_ID);
        result.current.ensureWeapon(WEAPON_ID);
      });

      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.weaponId).toBe(WEAPON_ID));
      expect(posts).toBe(1);
    });

    it('does not add another instance when the weapon is already owned', async () => {
      let posts = 0;
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 })]),
          ),
        ),
        http.post('http://localhost:8080/weapons', () => {
          posts += 1;
          return HttpResponse.json(
            weaponsDocument([makeWeapon(SECOND_INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 })]),
          );
        }),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

      act(() => {
        result.current.ensureWeapon(WEAPON_ID);
      });

      expect(posts).toBe(0);
    });
  });

  describe('removeWeapon', () => {
    it('restores a removed weapon when the delete fails', async () => {
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })]),
          ),
        ),
        http.delete(
          'http://localhost:8080/weapons/weapon-instance-1',
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
  });

  describe('setRefinementLevel', () => {
    it('reverts a refinement change when the update fails', async () => {
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })]),
          ),
        ),
        http.patch(
          'http://localhost:8080/weapons/weapon-instance-1',
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

    it('keeps a change that a refetch started before it would overwrite', async () => {
      const atLevel = (refinementLevel: RefinementLevel) =>
        weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel })]);
      // Answers with the server's state from before the second change.
      const staleRefetch = holdResponse(() => HttpResponse.json(atLevel(2)));
      const secondPatch = holdResponse(() => HttpResponse.json(atLevel(3)));
      let gets = 0;
      let patches = 0;
      server.use(
        http.get('http://localhost:8080/weapons', () => {
          gets += 1;
          if (gets === 1) return HttpResponse.json(atLevel(1));
          return staleRefetch.resolver();
        }),
        http.patch('http://localhost:8080/weapons/weapon-instance-1', () => {
          patches += 1;
          if (patches === 1) return HttpResponse.json(atLevel(2));
          return secondPatch.resolver();
        }),
      );

      const { result, queryClient } = renderHookSignedIn(() => useWeaponCollection(), 'user-1');
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(1));

      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, 2);
      });
      await waitFor(() => expect(gets).toBe(2));

      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, 3);
      });
      await waitFor(() => expect(patches).toBe(2));

      staleRefetch.release();
      await waitFor(() => expect(queryClient.isFetching()).toBe(0));
      expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(3);

      secondPatch.release();
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    });
  });
});
