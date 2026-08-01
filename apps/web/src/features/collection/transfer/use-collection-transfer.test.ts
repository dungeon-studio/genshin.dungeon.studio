// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, CollectionWeaponId, TeamSlot } from '@genshin/domain';
import { initialTeams } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useWeaponCollectionStore } from '@/features/collection/weapons/use-weapon-collection-store';
import { useTeamStore } from '@/features/teams/use-team-store';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

import { useCollectionTransfer } from './use-collection-transfer';

const API = 'http://localhost:8080';
const WEAPON_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

function exportFile(body: unknown): File {
  return new File([JSON.stringify(body)], 'collection.json', { type: 'application/json' });
}

function resetStores() {
  useCollectionStore.getState().clearCharacters();
  useWeaponCollectionStore.getState().clearWeapons();
  useTeamStore.getState().setTeams(initialTeams());
}

/** Signed out: no API involved, the stores are the whole collection. */
function renderSignedOut() {
  return renderHook(() => useCollectionTransfer(), { wrapper: createWrapper() });
}

describe('useCollectionTransfer', () => {
  beforeEach(() => {
    resetStores();
  });

  afterEach(() => {
    resetStores();
  });

  describe('round trip', () => {
    const envelope = {
      version: 1,
      exportedAt: '2026-08-01T12:00:00.000Z',
      characters: [{ characterId: 'amber', constellationLevel: 4 }],
      weapons: [
        { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 3 },
      ],
      teams: [
        {
          slot: 1,
          name: 'Vaporise',
          members: [{ characterId: 'amber', weaponInstanceId: WEAPON_ID }, null, null, null],
        },
      ],
    };

    it('restores every entry into an empty collection', async () => {
      const { result } = renderSignedOut();

      const plan = await result.current.readPlan(exportFile(envelope));
      expect(plan.ok).toBe(true);
      if (!plan.ok) return;

      await act(async () => {
        await result.current.applyImport(plan.plan);
      });

      expect(useCollectionStore.getState().characters.amber.constellationLevel).toBe(4);
      expect(useWeaponCollectionStore.getState().weapons[WEAPON_ID as CollectionWeaponId]).toEqual(
        expect.objectContaining({ weaponId: 'mistsplitter-reforged', refinementLevel: 3 }),
      );
      expect(useTeamStore.getState().teams[1].name).toBe('Vaporise');
    });

    it('keeps the team member pointing at the weapon it was exported with', async () => {
      const { result } = renderSignedOut();

      const plan = await result.current.readPlan(exportFile(envelope));
      if (!plan.ok) throw new Error('expected a readable plan');

      await act(async () => {
        await result.current.applyImport(plan.plan);
      });

      const member = useTeamStore.getState().teams[1].members[0];
      expect(member?.weaponInstanceId).toBe(WEAPON_ID);
      expect(useWeaponCollectionStore.getState().weapons).toHaveProperty(WEAPON_ID);
    });

    it('re-importing the same file changes nothing and duplicates nothing', async () => {
      const { result } = renderSignedOut();

      const first = await result.current.readPlan(exportFile(envelope));
      if (!first.ok) throw new Error('expected a readable plan');
      await act(async () => {
        await result.current.applyImport(first.plan);
      });

      const afterFirst = {
        characters: { ...useCollectionStore.getState().characters },
        weapons: { ...useWeaponCollectionStore.getState().weapons },
      };

      const second = await result.current.readPlan(exportFile(envelope));
      if (!second.ok) throw new Error('expected a readable plan');

      // Everything is now an update rather than a create — that is what stops
      // the second pass from minting a second copy of each weapon.
      expect(second.plan.characters.create).toHaveLength(0);
      expect(second.plan.weapons.create).toHaveLength(0);
      expect(second.plan.teams.create).toHaveLength(0);

      await act(async () => {
        await result.current.applyImport(second.plan);
      });

      expect(Object.keys(useCollectionStore.getState().characters)).toEqual(
        Object.keys(afterFirst.characters),
      );
      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toEqual(
        Object.keys(afterFirst.weapons),
      );
    });
  });

  describe('files it will not read', () => {
    it('rejects an envelope version it does not know', async () => {
      const { result } = renderSignedOut();

      const plan = await result.current.readPlan(exportFile({ version: 99, characters: [] }));

      expect(plan.ok).toBe(false);
      if (!plan.ok) expect(plan.message).toContain('version 99');
    });

    it('rejects a file that is not JSON', async () => {
      const { result } = renderSignedOut();

      const plan = await result.current.readPlan(
        new File(['not json at all'], 'x.json', { type: 'application/json' }),
      );

      expect(plan.ok).toBe(false);
      if (!plan.ok) expect(plan.message).toContain('not valid JSON');
    });

    it('imports the sound entries of a file holding one bad one', async () => {
      const { result } = renderSignedOut();

      const plan = await result.current.readPlan(
        exportFile({
          version: 1,
          exportedAt: '2026-08-01T12:00:00.000Z',
          characters: [
            { characterId: 'not-a-real-character', constellationLevel: 0 },
            { characterId: 'amber', constellationLevel: 1 },
          ],
          weapons: [],
          teams: [],
        }),
      );
      if (!plan.ok) throw new Error('expected a readable plan');

      await act(async () => {
        await result.current.applyImport(plan.plan);
      });

      expect(useCollectionStore.getState().characters).toHaveProperty('amber');
      expect(useCollectionStore.getState().characters).not.toHaveProperty('not-a-real-character');
      expect(plan.plan.skipped).toHaveLength(1);
    });
  });

  describe('when signed in', () => {
    it('writes weapons to the identifier-preserving endpoint', async () => {
      const seen: string[] = [];
      server.use(
        http.put(`${API}/api/weapons/:id`, ({ params }) => {
          seen.push(params.id as string);
          return HttpResponse.json({
            collection: {
              version: '1.0',
              href: `${API}/api/weapons`,
              items: [
                {
                  href: `${API}/api/weapons/${WEAPON_ID}`,
                  data: [
                    { name: 'weaponInstanceId', value: WEAPON_ID },
                    { name: 'weaponId', value: 'mistsplitter-reforged' },
                    { name: 'refinementLevel', value: 3 },
                    { name: 'createdAt', value: '2026-01-01T00:00:00.000Z' },
                    { name: 'updatedAt', value: '2026-01-01T00:00:00.000Z' },
                  ],
                },
              ],
            },
          });
        }),
        http.get(`${API}/api/weapons`, () =>
          HttpResponse.json({
            collection: { version: '1.0', href: `${API}/api/weapons`, items: [] },
          }),
        ),
        http.get(`${API}/api/characters`, () =>
          HttpResponse.json({
            collection: { version: '1.0', href: `${API}/api/characters`, items: [] },
          }),
        ),
        http.get(`${API}/api/teams`, () =>
          HttpResponse.json({
            collection: { version: '1.0', href: `${API}/api/teams`, items: [] },
          }),
        ),
      );

      const { result } = renderHook(() => useCollectionTransfer(), {
        wrapper: createWrapper({ user: fakeUser('user-1') }),
      });

      const plan = await result.current.readPlan(
        exportFile({
          version: 1,
          exportedAt: '2026-08-01T12:00:00.000Z',
          characters: [],
          weapons: [
            { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 3 },
          ],
          teams: [],
        }),
      );
      if (!plan.ok) throw new Error('expected a readable plan');

      await act(async () => {
        await result.current.applyImport(plan.plan);
      });

      await waitFor(() => {
        expect(seen).toEqual([WEAPON_ID]);
      });
    });
  });
});

describe('exportCollection', () => {
  beforeEach(() => {
    resetStores();
  });

  it('serialises what the stores currently hold', async () => {
    useCollectionStore.getState().addCharacter('amber');
    useWeaponCollectionStore.getState().addWeapon({
      weaponInstanceId: WEAPON_ID as CollectionWeaponId,
      weaponId: 'mistsplitter-reforged',
      refinementLevel: 2,
      createdAt: '2026-01-01T00:00:00.000Z' as CollectionTeam['createdAt'],
      updatedAt: '2026-01-01T00:00:00.000Z' as CollectionTeam['updatedAt'],
    });

    const { result } = renderSignedOut();

    let downloaded: string | undefined;
    const originalCreate = URL.createObjectURL;
    URL.createObjectURL = ((blob: Blob) => {
      void blob.text().then((text) => {
        downloaded = text;
      });
      return 'blob:stub';
    }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL;

    try {
      act(() => {
        result.current.exportCollection();
      });

      await waitFor(() => {
        expect(downloaded).toBeDefined();
      });
    } finally {
      URL.createObjectURL = originalCreate;
    }

    const envelope = JSON.parse(downloaded ?? '{}') as {
      version: number;
      characters: unknown[];
      weapons: unknown[];
      teams: Record<TeamSlot, unknown>[];
    };

    expect(envelope.version).toBe(1);
    expect(envelope.characters).toHaveLength(1);
    expect(envelope.weapons).toHaveLength(1);
    expect(envelope.teams).toHaveLength(0);
  });
});
