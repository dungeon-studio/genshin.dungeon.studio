// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, ISOTimestamp, TeamSlot } from '@genshin/domain';
import { initialTeams } from '@genshin/domain';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useWeaponCollectionStore } from '@/features/collection/weapons/use-weapon-collection-store';
import { useTeamStore } from '@/features/teams/use-team-store';
import { charactersDocument, makeCharacter, makeWeapon, weaponsDocument } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

import type { ImportPlan } from './plan-import';
import type { UseCollectionTransferResult } from './use-collection-transfer';
import { useCollectionTransfer } from './use-collection-transfer';

const API = 'http://localhost:8080';
const WEAPON_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const OTHER_WEAPON_ID = '9c858901-8a57-4791-81fe-4c455b099bc9';
const FIXED = '2026-01-01T00:00:00.000Z' as ISOTimestamp;

const ENVELOPE_HEAD = { version: 1, exportedAt: '2026-08-01T12:00:00.000Z' };

function exportFile(body: unknown): File {
  return new File([JSON.stringify(body)], 'collection.json', { type: 'application/json' });
}

function resetStores() {
  useCollectionStore.getState().clearCharacters();
  useWeaponCollectionStore.getState().clearWeapons();
  useTeamStore.getState().setTeams(initialTeams());
}

function ownWeapon(instanceId: string, weaponId: string, refinementLevel: number) {
  useWeaponCollectionStore.getState().addWeapon(makeWeapon(instanceId, weaponId, refinementLevel));
}

/** Instance ids the API was asked to write, in order. */
let weaponWrites: string[] = [];

function stubCollectionWrites() {
  weaponWrites = [];

  server.use(
    http.put(`${API}/api/characters/:characterId`, ({ params }) =>
      HttpResponse.json(charactersDocument([makeCharacter(params.characterId as string)])),
    ),
    http.put(`${API}/api/weapons/:weaponInstanceId`, ({ params }) => {
      const id = params.weaponInstanceId as string;
      weaponWrites.push(id);
      return HttpResponse.json(weaponsDocument([makeWeapon(id, 'mistsplitter-reforged', 1)]));
    }),
    http.put(`${API}/api/teams/:slot`, () => HttpResponse.json({})),
  );
}

function renderSignedIn() {
  return renderHook(() => useCollectionTransfer(), {
    wrapper: createWrapper({ user: fakeUser('user-1') }),
  });
}

function renderSignedOut() {
  return renderHook(() => useCollectionTransfer(), { wrapper: createWrapper() });
}

async function applyFile(
  result: { current: UseCollectionTransferResult },
  envelope: unknown,
): Promise<ImportPlan> {
  const parsed = await result.current.readPlan(exportFile(envelope));
  if (!parsed.ok) throw new Error(`expected a readable plan: ${parsed.message}`);

  await act(async () => {
    await result.current.applyImport(parsed.plan);
  });

  return parsed.plan;
}

describe('useCollectionTransfer', () => {
  beforeEach(() => {
    resetStores();
    stubCollectionWrites();
  });
  afterEach(resetStores);

  describe('round trip', () => {
    const envelope = {
      ...ENVELOPE_HEAD,
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
      const { result } = renderSignedIn();

      await applyFile(result, envelope);

      expect(useCollectionStore.getState().characters.amber.constellationLevel).toBe(4);
      expect(useWeaponCollectionStore.getState().weapons[WEAPON_ID as CollectionWeaponId]).toEqual(
        expect.objectContaining({ weaponId: 'mistsplitter-reforged', refinementLevel: 3 }),
      );
      expect(useTeamStore.getState().teams[1].name).toBe('Vaporise');
    });

    it('keeps the team member pointing at the weapon it was exported with', async () => {
      const { result } = renderSignedIn();

      await applyFile(result, envelope);

      expect(useTeamStore.getState().teams[1].members[0]?.weaponInstanceId).toBe(WEAPON_ID);
      expect(useWeaponCollectionStore.getState().weapons).toHaveProperty(WEAPON_ID);
    });

    it('writes weapons to the identifier-preserving endpoint', async () => {
      const { result } = renderSignedIn();

      await applyFile(result, envelope);

      await waitFor(() => {
        expect(weaponWrites).toEqual([WEAPON_ID]);
      });
    });

    it('re-importing the same file changes nothing and duplicates nothing', async () => {
      const { result } = renderSignedIn();

      await applyFile(result, envelope);
      const afterFirst = Object.keys(useWeaponCollectionStore.getState().weapons);

      const second = await applyFile(result, envelope);

      // Everything is an update the second time round; that is what stops a
      // second pass minting a second copy of each weapon.
      expect(second.characters.create).toHaveLength(0);
      expect(second.weapons.create).toHaveLength(0);
      expect(second.teams.create).toHaveLength(0);
      expect(Object.keys(useWeaponCollectionStore.getState().weapons)).toEqual(afterFirst);
    });
  });

  describe('importing over a collection that already holds data', () => {
    it('lets the file lower a constellation level rather than keeping the higher one', async () => {
      // Deliberately unlike the sign-in merge, which keeps whichever level is
      // higher: restoring a file means matching it, not merging with it.
      useCollectionStore.getState().addCharacter('amber');
      useCollectionStore.getState().setConstellationLevel('amber', 6);
      const { result } = renderSignedIn();

      await applyFile(result, {
        ...ENVELOPE_HEAD,
        characters: [{ characterId: 'amber', constellationLevel: 1 }],
        weapons: [],
        teams: [],
      });

      expect(useCollectionStore.getState().characters.amber.constellationLevel).toBe(1);
    });

    it('keeps weapons the file does not mention, because instances are separate copies', async () => {
      ownWeapon(OTHER_WEAPON_ID, 'mistsplitter-reforged', 5);
      const { result } = renderSignedIn();

      await applyFile(result, {
        ...ENVELOPE_HEAD,
        characters: [],
        weapons: [
          { weaponInstanceId: WEAPON_ID, weaponId: 'mistsplitter-reforged', refinementLevel: 1 },
        ],
        teams: [],
      });

      const weapons = useWeaponCollectionStore.getState().weapons;
      expect(Object.keys(weapons)).toHaveLength(2);
      expect(weapons[OTHER_WEAPON_ID as CollectionWeaponId].refinementLevel).toBe(5);
    });

    it('replaces a team slot outright rather than merging its members', async () => {
      useTeamStore.getState().setTeam(1, {
        slot: 1 as TeamSlot,
        name: 'Existing',
        members: [{ characterId: 'xiangling' }, { characterId: 'bennett' }, null, null],
        createdAt: FIXED,
        updatedAt: FIXED,
      });
      const { result } = renderSignedIn();

      const plan = await applyFile(result, {
        ...ENVELOPE_HEAD,
        characters: [],
        weapons: [],
        teams: [
          { slot: 1, name: 'Imported', members: [{ characterId: 'amber' }, null, null, null] },
        ],
      });

      expect(plan.teams.update).toHaveLength(1);
      const team = useTeamStore.getState().teams[1];
      expect(team.name).toBe('Imported');
      expect(team.members.map((member) => member?.characterId ?? null)).toEqual([
        'amber',
        null,
        null,
        null,
      ]);
    });
  });

  describe('files it will not read', () => {
    it('rejects an envelope version it does not know', async () => {
      const { result } = renderSignedIn();

      const plan = await result.current.readPlan(exportFile({ version: 99, characters: [] }));

      expect(plan.ok).toBe(false);
      if (!plan.ok) expect(plan.message).toContain('version 99');
    });

    it('rejects a file that is not JSON', async () => {
      const { result } = renderSignedIn();

      const plan = await result.current.readPlan(new File(['not json at all'], 'x.json'));

      expect(plan.ok).toBe(false);
      if (!plan.ok) expect(plan.message).toContain('not valid JSON');
    });

    it('imports the sound entries of a file holding one bad one', async () => {
      const { result } = renderSignedIn();

      const plan = await applyFile(result, {
        ...ENVELOPE_HEAD,
        characters: [
          { characterId: 'not-a-real-character', constellationLevel: 0 },
          { characterId: 'amber', constellationLevel: 1 },
        ],
        weapons: [],
        teams: [],
      });

      expect(useCollectionStore.getState().characters).toHaveProperty('amber');
      expect(useCollectionStore.getState().characters).not.toHaveProperty('not-a-real-character');
      expect(plan.skipped).toHaveLength(1);
    });
  });

  describe('signed out', () => {
    it('withholds import, which the sign-in merge would silently undo', () => {
      const { result } = renderSignedOut();

      expect(result.current.canImport).toBe(false);
    });

    it('still exports, since reading a collection needs no account', async () => {
      useCollectionStore.getState().addCharacter('amber');
      ownWeapon(WEAPON_ID, 'mistsplitter-reforged', 2);
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
        teams: unknown[];
      };

      expect(envelope.version).toBe(1);
      expect(envelope.characters).toHaveLength(1);
      expect(envelope.weapons).toHaveLength(1);
      expect(envelope.teams).toHaveLength(0);
    });
  });
});
