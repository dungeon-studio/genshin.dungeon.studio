// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, RefinementLevel } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWeapon, weaponsDocument } from '@/test/fixtures';
import { holdResponse } from '@/test/msw/held-response';
import { matchJsonBody } from '@/test/msw/match-json-body';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser, renderHookSignedIn } from '@/test/render';
import { selectUndo } from '@/test/undo-toast';

import { useWeaponCollection } from './use-weapon-collection';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const WEAPON_ID = 'angelos-heptades';
const INSTANCE_ID = 'weapon-instance-1' as CollectionWeaponId;

beforeEach(() => {
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
    it('adds the server-confirmed weapon to the collection', async () => {
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

    it('names the weapon a failed add was for', async () => {
      server.use(
        http.get('http://localhost:8080/weapons', () => HttpResponse.json(weaponsDocument([]))),
        http.post('http://localhost:8080/weapons', () => new HttpResponse(null, { status: 500 })),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.addWeapon(WEAPON_ID);
      });

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith("Couldn't add Angelos' Heptades. Try again."),
      );
    });

    it('creates another instance even when the weapon is already owned', async () => {
      const owned = makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 });
      const added = makeWeapon(SECOND_INSTANCE_ID, WEAPON_ID, { refinementLevel: 1 });
      let serverWeapons = [owned];
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(weaponsDocument(serverWeapons)),
        ),
        http.post('http://localhost:8080/weapons', () => {
          serverWeapons = [owned, added];
          return HttpResponse.json(weaponsDocument([added]));
        }),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

      act(() => {
        result.current.addWeapon(WEAPON_ID);
      });

      await waitFor(() => expect(result.current.weapons[SECOND_INSTANCE_ID]).toBeDefined());
      expect(result.current.weapons[INSTANCE_ID]).toBeDefined();
    });

    it('shows nothing of an add that settles after sign-out', async () => {
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
      expect(result.current.weapons).toEqual({});
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
      const deletion = holdResponse(() => new HttpResponse(null, { status: 500 }));
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })]),
          ),
        ),
        http.delete('http://localhost:8080/weapons/weapon-instance-1', deletion.resolver),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

      act(() => {
        result.current.removeWeapon(INSTANCE_ID);
      });

      // Optimistically gone, then restored once the delete errors.
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeUndefined());
      deletion.release();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't remove Angelos' Heptades. Angelos' Heptades is back in your collection. Try again.",
      );
    });
  });

  describe('undoing a removal', () => {
    it('brings back a copy at the removed refinement rank', async () => {
      const restored = makeWeapon(SECOND_INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 });
      let serverWeapons = [makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })];
      let postBody: unknown;
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(weaponsDocument(serverWeapons)),
        ),
        http.delete('http://localhost:8080/weapons/weapon-instance-1', () => {
          serverWeapons = [];
          return new HttpResponse(null, { status: 204 });
        }),
        http.post('http://localhost:8080/weapons', async ({ request }) => {
          postBody = await request.json();
          serverWeapons = [restored];
          return HttpResponse.json(weaponsDocument([restored]));
        }),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

      act(() => {
        result.current.removeWeapon(INSTANCE_ID);
      });
      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      act(() => {
        selectUndo("Removed Angelos' Heptades at refinement rank 2.");
      });

      await waitFor(() =>
        expect(result.current.weapons[SECOND_INSTANCE_ID]?.refinementLevel).toBe(2),
      );
      expect(postBody).toEqual({ weaponId: WEAPON_ID, refinementLevel: 2 });
    });

    it('names the copy a failed restore was for', async () => {
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })]),
          ),
        ),
        http.delete(
          'http://localhost:8080/weapons/weapon-instance-1',
          () => new HttpResponse(null, { status: 204 }),
        ),
        http.post('http://localhost:8080/weapons', () => new HttpResponse(null, { status: 500 })),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]).toBeDefined());

      act(() => {
        result.current.removeWeapon(INSTANCE_ID);
      });
      await waitFor(() => expect(toast.success).toHaveBeenCalled());
      act(() => {
        selectUndo("Removed Angelos' Heptades at refinement rank 2.");
      });

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Couldn't bring back Angelos' Heptades at refinement rank 2. Try again.",
        ),
      );
    });
  });

  describe('setRefinementLevel', () => {
    it('reverts a refinement change when the update fails', async () => {
      const update = holdResponse(() => new HttpResponse(null, { status: 500 }));
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })]),
          ),
        ),
        http.patch('http://localhost:8080/weapons/weapon-instance-1', update.resolver),
      );

      const { result } = renderAuthed();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(2));

      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, 5);
      });

      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(5));
      update.release();
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(2));
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't set Angelos' Heptades to refinement rank 5. Angelos' Heptades is back at refinement rank 2. Try again.",
      );
    });

    it("returns to the server's rank when two rapid refinement changes both fail", async () => {
      const secondFailure = holdResponse(() => new HttpResponse(null, { status: 500 }));
      const serverRank = 2;
      const firstRank = 3;
      const secondRank = 4;
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: serverRank })]),
          ),
        ),
        http.patch(
          matchJsonBody<{ refinementLevel: number }>(
            'http://localhost:8080/weapons/weapon-instance-1',
            ({ refinementLevel }) => refinementLevel === secondRank,
          ),
          secondFailure.resolver,
        ),
        http.patch(
          'http://localhost:8080/weapons/weapon-instance-1',
          () => new HttpResponse(null, { status: 500 }),
        ),
      );

      const { result } = renderAuthed();
      const rank = () => result.current.weapons[INSTANCE_ID]?.refinementLevel;
      await waitFor(() => expect(rank()).toBe(serverRank));

      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, firstRank);
      });
      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, secondRank);
      });
      // The first failure leaves the newer edit, and the second rolls back to the
      // rank the first one sent.
      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith(
          "Couldn't set Angelos' Heptades to refinement rank 3. Your newer change stands.",
        ),
      );
      await act(() => secondFailure.arrived);
      secondFailure.release();

      await waitFor(() => expect(rank()).toBe(serverRank));
    });

    it('keeps a newer change when an earlier one fails', async () => {
      const firstUpdate = holdResponse(() => new HttpResponse(null, { status: 500 }));
      const secondUpdate = holdResponse(() =>
        HttpResponse.json(
          weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 4 })]),
        ),
      );
      let patches = 0;
      server.use(
        http.get('http://localhost:8080/weapons', () =>
          HttpResponse.json(
            weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel: 2 })]),
          ),
        ),
        http.patch('http://localhost:8080/weapons/weapon-instance-1', () => {
          patches += 1;
          return patches === 1 ? firstUpdate.resolver() : secondUpdate.resolver();
        }),
      );

      const { result, queryClient } = renderHookSignedIn(() => useWeaponCollection(), 'user-1');
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(2));

      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, 3);
      });
      await waitFor(() => expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(3));
      act(() => {
        result.current.setRefinementLevel(INSTANCE_ID, 4);
      });
      await waitFor(() => expect(patches).toBe(2));

      firstUpdate.release();
      await waitFor(() => expect(toast.error).toHaveBeenCalled());
      expect(result.current.weapons[INSTANCE_ID]?.refinementLevel).toBe(4);
      expect(toast.error).toHaveBeenCalledWith(
        "Couldn't set Angelos' Heptades to refinement rank 3. Your newer change stands.",
      );

      secondUpdate.release();
      await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    });

    it('keeps a change that a refetch started before it would overwrite', async () => {
      const atLevel = (refinementLevel: RefinementLevel) =>
        weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID, { refinementLevel })]);
      // Answers with the server's state from before the second change.
      const staleRefetch = holdResponse(() => HttpResponse.json(atLevel(2)));
      const secondPatch = holdResponse(() => HttpResponse.json(atLevel(3)));
      let patches = 0;
      server.use(
        http.get('http://localhost:8080/weapons', () => HttpResponse.json(atLevel(1)), {
          once: true,
        }),
        http.get('http://localhost:8080/weapons', staleRefetch.resolver, { once: true }),
        http.get('http://localhost:8080/weapons', () => HttpResponse.json(atLevel(3))),
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
      await waitFor(() => expect(queryClient.isFetching()).toBe(1));

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

describe('useWeaponCollection loading', () => {
  it('keeps a loaded collection when a later refetch fails', async () => {
    server.use(
      http.get('http://localhost:8080/weapons', () =>
        HttpResponse.json(weaponsDocument([makeWeapon(INSTANCE_ID, WEAPON_ID)])),
      ),
    );
    const { result, queryClient } = renderHookSignedIn(() => useWeaponCollection(), 'user-1');
    await waitFor(() => expect(result.current.getWeaponsByWeaponId(WEAPON_ID)).toHaveLength(1));

    server.use(
      http.get('http://localhost:8080/weapons', () => new HttpResponse(null, { status: 500 })),
    );
    await act(() => queryClient.invalidateQueries());

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.loadFailed).toBe(false);
    expect(result.current.getWeaponsByWeaponId(WEAPON_ID)).toHaveLength(1);
  });
});
