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

// These mount the whole page and drive it through many interactions, which runs
// several times slower when the rest of the suite is competing for workers than it
// does alone — past the default one-second budget for async queries.
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
const BOW_WEAPON = weaponOfType('Bow');
const CLAYMORE_USER = characterWielding('Claymore');
const BOW_USER = characterWielding('Bow');
const CLAYMORE_INSTANCE = 'claymore-instance' as CollectionWeaponId;
const BOW_INSTANCE = 'bow-instance' as CollectionWeaponId;

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
      [BOW_INSTANCE]: {
        weaponInstanceId: BOW_INSTANCE,
        weaponId: BOW_WEAPON.id,
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

    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
  }, 30_000);

  it('offers weapons of any type, filterable, on a member with no character', async () => {
    const user = userEvent.setup({ delay: null });
    renderTeamsPage();

    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));

    expect(
      await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Assign ${BOW_WEAPON.name} to character` }),
    ).toBeInTheDocument();

    // The type chips are hidden in the character-first flow, where the type is fixed.
    expect(screen.getByRole('button', { name: 'Filter by Claymore' })).toBeInTheDocument();
  }, 30_000);

  it('restores the whole character pool when the pending weapon is cleared', async () => {
    const user = userEvent.setup({ delay: null });
    renderTeamsPage();

    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));
    await user.click(
      await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
    );
    await user.click(screen.getByRole('button', { name: 'Characters' }));

    expect(await screen.findByText(new RegExp(`Showing Claymore users for`))).toBeInTheDocument();
    expect(screen.getByText(CLAYMORE.name)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear weapon' }));

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Showing Claymore users for/)).not.toBeInTheDocument();
  }, 30_000);

  describe('character-first flow', () => {
    it('constrains the weapon pool to the assigned character and equips from it', async () => {
      const user = userEvent.setup({ delay: null });
      renderTeamsPage();

      await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
      await user.click(
        await screen.findByRole('button', { name: `Add ${CLAYMORE_USER.name} to team` }),
      );
      await user.click(screen.getByRole('button', { name: 'Weapons' }));

      const claymore = await screen.findByRole('button', {
        name: `Assign ${CLAYMORE.name} to character`,
      });
      expect(
        screen.queryByRole('button', { name: `Assign ${BOW_WEAPON.name} to character` }),
      ).not.toBeInTheDocument();

      await user.click(claymore);

      expect(useTeamStore.getState().teams[1].members[0]).toEqual({
        characterId: CLAYMORE_USER.id,
        weaponInstanceId: CLAYMORE_INSTANCE,
      });
    }, 30_000);

    it('empties the slot when the assigned character is picked again', async () => {
      const user = userEvent.setup({ delay: null });
      renderTeamsPage();

      await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
      await user.click(
        await screen.findByRole('button', { name: `Add ${CLAYMORE_USER.name} to team` }),
      );

      // Now assigned, so the same card offers removal.
      await user.click(
        await screen.findByRole('button', { name: `Remove ${CLAYMORE_USER.name} from team` }),
      );

      expect(useTeamStore.getState().teams[1].members[0]).toBeNull();
    }, 30_000);

    it('unequips the weapon when the equipped one is picked again', async () => {
      const user = userEvent.setup({ delay: null });
      renderTeamsPage();

      await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
      await user.click(
        await screen.findByRole('button', { name: `Add ${CLAYMORE_USER.name} to team` }),
      );
      await user.click(screen.getByRole('button', { name: 'Weapons' }));
      await user.click(
        await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
      );

      // Now selected, so the same card offers removal.
      await user.click(
        await screen.findByRole('button', { name: `Remove ${CLAYMORE.name} from character` }),
      );

      expect(useTeamStore.getState().teams[1].members[0]).toEqual({
        characterId: CLAYMORE_USER.id,
      });
    }, 30_000);
  });

  it('drops a pending weapon when the same card is picked again', async () => {
    const user = userEvent.setup({ delay: null });
    renderTeamsPage();

    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));
    await user.click(
      await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
    );
    await user.click(
      await screen.findByRole('button', { name: `Remove ${CLAYMORE.name} from character` }),
    );

    await user.click(screen.getByRole('button', { name: 'Characters' }));

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/users for/)).not.toBeInTheDocument();
  }, 30_000);

  it('forgets a pending weapon once the editor is closed', async () => {
    const user = userEvent.setup({ delay: null });
    renderTeamsPage();

    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));
    await user.click(
      await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
    );

    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click((await screen.findAllByRole('button', { name: /No character/ }))[0]);

    // Reopened on the same member, so a surviving weapon would still be constraining.
    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/users for/)).not.toBeInTheDocument();
  }, 30_000);
});
