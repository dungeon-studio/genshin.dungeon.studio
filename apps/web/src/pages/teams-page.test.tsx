// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeaponId, ISOTimestamp } from '@genshin/domain';
import type { Character, Weapon, WeaponType } from '@genshin/game-data';
import { CHARACTERS, WEAPONS } from '@genshin/game-data';
import { act, configure, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useWeaponCollectionStore } from '@/features/collection/weapons/use-weapon-collection-store';
import { useTeamStore } from '@/features/teams/use-team-store';
import { createWrapper } from '@/test/render';

import { TeamsPage } from './teams-page';

// Each pool renders a card per character and per weapon in the game data, which is
// slow enough in jsdom to outrun the default one-second budget when the rest of the
// suite is competing for workers.
configure({ asyncUtilTimeout: 10_000 });

// The page draws from real game data, so fixtures have to be real entries.
function characterWielding(weaponType: WeaponType): Character {
  const character = CHARACTERS.find((c) => c.weaponType === weaponType);
  if (!character) throw new Error(`no ${weaponType} user in game data`);
  return character;
}

function weaponOfType(weaponType: WeaponType): Weapon {
  const weapon = WEAPONS.find((w) => w.type === weaponType);
  if (!weapon) throw new Error(`no ${weaponType} in game data`);
  return weapon;
}

const CLAYMORE = weaponOfType('Claymore');
const CLAYMORE_USER = characterWielding('Claymore');
const BOW_USER = characterWielding('Bow');
const CLAYMORE_INSTANCE = 'claymore-instance' as CollectionWeaponId;

const TIMESTAMP = '2026-01-01T00:00:00.000Z' as ISOTimestamp;

function renderTeamsPage() {
  const result = render(
    <MemoryRouter>
      <TeamsPage />
    </MemoryRouter>,
    { wrapper: createWrapper() },
  );

  // Seeded after mount: the hooks clear their stores on finding no signed-in user.
  act(() => {
    useCollectionStore.getState().replaceCharacters(
      Object.fromEntries(
        [CLAYMORE_USER, BOW_USER].map((c) => [
          c.id,
          {
            characterId: c.id,
            constellationLevel: 0,
            createdAt: TIMESTAMP,
            updatedAt: TIMESTAMP,
          },
        ]),
      ),
    );
    useWeaponCollectionStore.getState().setWeapons({
      [CLAYMORE_INSTANCE]: {
        weaponInstanceId: CLAYMORE_INSTANCE,
        weaponId: CLAYMORE.id,
        refinementLevel: 1,
        createdAt: TIMESTAMP,
        updatedAt: TIMESTAMP,
      },
    });
  });

  return result;
}

describe('TeamsPage weapon-first flow', () => {
  beforeEach(() => {
    useTeamStore.getState().resetTeams();
    useCollectionStore.getState().clearCharacters();
    useWeaponCollectionStore.getState().clearWeapons();
  });

  it('assigns a weapon picked before a character, and narrows the pool to its wielders', async () => {
    const user = userEvent.setup({ delay: null });
    renderTeamsPage();

    // Every unfilled member card matches; the first is team 1's leading slot.
    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));
    await user.click(
      await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
    );

    await user.click(screen.getByRole('button', { name: 'Characters' }));

    // Awaited first so the absence below is checked against a rendered pool.
    const claymoreUserCard = await screen.findByRole('button', {
      name: `Add ${CLAYMORE_USER.name} to team`,
    });
    expect(
      screen.queryByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).not.toBeInTheDocument();

    await user.click(claymoreUserCard);

    expect(useTeamStore.getState().teams[1].members[0]).toEqual({
      characterId: CLAYMORE_USER.id,
      weaponInstanceId: CLAYMORE_INSTANCE,
    });
  }, 30_000);

  it('leaves the character pool unnarrowed when no weapon was picked first', async () => {
    const user = userEvent.setup({ delay: null });
    renderTeamsPage();

    // Every unfilled member card matches; the first is team 1's leading slot.
    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
  }, 30_000);
});
