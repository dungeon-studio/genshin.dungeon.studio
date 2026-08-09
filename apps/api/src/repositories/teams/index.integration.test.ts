// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { TeamSlot } from '@genshin/domain';
import { CHARACTERS } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { documentRef, newUserId } from '@/test/firestore.js';

import { get, list, remove, save } from './index.js';

const SLOT: TeamSlot = 1;
const CHARACTER = CHARACTERS[0];
const TEAM_NAME = 'Vaporise';

const CREATED_AT = '2026-01-01T00:00:00.000Z';
const UPDATED_AT = '2026-01-02T00:00:00.000Z';

const teamRef = (userId: string, documentId: string) => documentRef(userId, 'teams', documentId);

describe('get', () => {
  it('returns the team saved in that slot', async () => {
    const userId = newUserId();
    await save(userId, SLOT, { name: TEAM_NAME });

    const team = await get(userId, SLOT);

    expect(team?.name).toBe(TEAM_NAME);
  });

  it('is null for a slot the user never saved', async () => {
    expect(await get(newUserId(), SLOT)).toBeNull();
  });
});

describe('remove', () => {
  it('leaves nothing to get', async () => {
    const userId = newUserId();
    await save(userId, SLOT, { name: TEAM_NAME });

    await remove(userId, SLOT);

    expect(await get(userId, SLOT)).toBeNull();
  });
});

describe('list', () => {
  // The routes reject any slot outside 1-4 before the repository sees it.
  // Reading such a document back as a team would hand `fromDocument` a slot the
  // domain rejects.
  it('skips documents whose id is not a slot', async () => {
    const userId = newUserId();
    await save(userId, SLOT, { name: TEAM_NAME });
    await teamRef(userId, '9').set({
      schemaVersion: 1,
      name: 'Out of range',
      members: [null, null, null, null],
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    });

    const teams = await list(userId);

    expect(teams.map((team) => team.slot)).toEqual([SLOT]);
  });
});

describe('a document stored before schemaVersion existed', () => {
  it('still reads', async () => {
    const userId = newUserId();
    const unstamped = {
      name: TEAM_NAME,
      members: [{ characterId: CHARACTER.id }, null, null, null],
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    };
    await teamRef(userId, String(SLOT)).set(unstamped);

    const team = await get(userId, SLOT);

    expect(team).toEqual({ slot: SLOT, ...unstamped });
  });
});
