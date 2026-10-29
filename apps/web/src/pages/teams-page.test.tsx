// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, CollectionWeaponId, TeamSlot } from '@genshin/domain';
import type { Character, Weapon, WeaponType } from '@genshin/game-data';
import { CHARACTER_ROSTER, WEAPON_ROSTER } from '@genshin/game-data';
import { act, configure, render, screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useCollectionStore } from '@/features/collection/characters/use-character-collection-store';
import { useTeamStore } from '@/features/teams/use-team-store';
import {
  charactersDocument,
  makeCharacter,
  makeTeam,
  makeWeapon,
  teamsDocument,
  weaponsDocument,
} from '@/test/fixtures';
import { holdResponse } from '@/test/msw/held-response';
import { server } from '@/test/msw/server';
import { TestProviders } from '@/test/providers';
import { createTestQueryClient, createWrapper, fakeUser } from '@/test/render';

import { TeamsPage } from './teams-page';

// These mount the whole page and drive it through many interactions, which runs
// several times slower when the rest of the suite is competing for workers than it
// does alone — past the default one-second budget for async queries.
configure({ asyncUtilTimeout: 10_000 });

// The page draws from real game data, so fixtures have to be real entries.
function characterWielding(weaponType: WeaponType, except?: Character): Character {
  const character = CHARACTER_ROSTER.find((c) => c.weaponType === weaponType && c !== except);
  if (!character) throw new Error(`no ${weaponType} user in game data`);
  return character;
}

function weaponOfType(weaponType: WeaponType): Weapon {
  const weapon = WEAPON_ROSTER.find((w) => w.type === weaponType);
  if (!weapon) throw new Error(`no ${weaponType} in game data`);
  return weapon;
}

const CLAYMORE = weaponOfType('Claymore');
const BOW_WEAPON = weaponOfType('Bow');
const CLAYMORE_USER = characterWielding('Claymore');
const BOW_USER = characterWielding('Bow');
const OTHER_CLAYMORE_USER = characterWielding('Claymore', CLAYMORE_USER);
const CLAYMORE_INSTANCE = 'claymore-instance' as CollectionWeaponId;
const BOW_INSTANCE = 'bow-instance' as CollectionWeaponId;

async function firstEmptyMember() {
  const [member] = await screen.findAllByRole('button', { name: /No character/ });
  if (!member) throw new Error('no empty member position');
  return member;
}

function AuthLoading({ children }: { children: ReactNode }) {
  return (
    <TestProviders queryClient={createTestQueryClient()} auth={{ status: 'loading' }}>
      {children}
    </TestProviders>
  );
}

function renderTeamsPage(wrapper = createWrapper()): void {
  render(
    <MemoryRouter>
      <TeamsPage />
    </MemoryRouter>,
    { wrapper },
  );
}

/**
 * Serves a signed-in user owning two characters and a weapon for each, keeping
 * the teams they save.
 */
function serveCollections(): void {
  const savedTeams = new Map<TeamSlot, CollectionTeam>();
  server.use(
    http.get('http://localhost:8080/characters', () =>
      HttpResponse.json(
        charactersDocument([CLAYMORE_USER, BOW_USER].map((c) => makeCharacter(c.id))),
      ),
    ),
    http.get('http://localhost:8080/weapons', () =>
      HttpResponse.json(
        weaponsDocument([
          makeWeapon(CLAYMORE_INSTANCE, CLAYMORE.id),
          makeWeapon(BOW_INSTANCE, BOW_WEAPON.id),
        ]),
      ),
    ),
    http.get('http://localhost:8080/teams', () =>
      HttpResponse.json(teamsDocument([...savedTeams.values()])),
    ),
    http.put('http://localhost:8080/teams/:slot', async ({ params, request }) => {
      const slot = Number(params['slot']) as TeamSlot;
      const body = (await request.json()) as Pick<CollectionTeam, 'name' | 'members'>;
      savedTeams.set(slot, makeTeam(slot, body));
      return new HttpResponse(null, { status: 204 });
    }),
  );
}

async function setupTeamsPage(): Promise<UserEvent> {
  const user = userEvent.setup({ delay: null });
  serveCollections();
  renderTeamsPage(createWrapper({ user: fakeUser('user-1') }));
  await screen.findByRole('region', { name: 'Team 2' });
  return user;
}

async function pickWeaponFirst(user: UserEvent, weapon: Weapon): Promise<void> {
  await user.click(await firstEmptyMember());
  await user.click(await screen.findByRole('button', { name: 'Weapons' }));
  await user.click(
    await screen.findByRole('button', { name: `Assign ${weapon.name} to character` }),
  );
}

async function pickCharacterFirst(user: UserEvent, character: Character): Promise<void> {
  await user.click(await firstEmptyMember());
  await user.click(await screen.findByRole('button', { name: `Add ${character.name} to team` }));
}

beforeEach(() => {
  useTeamStore.getState().resetTeams();
  useCollectionStore.getState().clearCharacters();
});

// Under coverage, with the rest of the suite competing for workers, a case runs
// to tens of seconds.
describe('TeamsPage weapon-first flow', { timeout: 60_000 }, () => {
  it('assigns a weapon picked before a character, and narrows the pool to its wielders', async () => {
    const user = await setupTeamsPage();

    await pickWeaponFirst(user, CLAYMORE);
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
  });

  it('leaves the character pool unnarrowed when no weapon was picked first', async () => {
    const user = await setupTeamsPage();

    await user.click(await firstEmptyMember());

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
  });

  it('offers weapons of any type, filterable, on a member with no character', async () => {
    const user = await setupTeamsPage();

    await user.click(await firstEmptyMember());
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));

    expect(
      await screen.findByRole('button', { name: `Assign ${CLAYMORE.name} to character` }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: `Assign ${BOW_WEAPON.name} to character` }),
    ).toBeInTheDocument();

    // The type chips are hidden in the character-first flow, where the type is fixed.
    expect(screen.getByRole('button', { name: 'Filter by Claymore' })).toBeInTheDocument();
  });

  it('restores the whole character pool when the pending weapon is cleared', async () => {
    const user = await setupTeamsPage();

    await pickWeaponFirst(user, CLAYMORE);
    await user.click(screen.getByRole('button', { name: 'Characters' }));

    expect(await screen.findByText(new RegExp(`Showing Claymore users for`))).toBeInTheDocument();
    expect(screen.getByText(CLAYMORE.name)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear weapon' }));

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Showing Claymore users for/)).not.toBeInTheDocument();
  });

  describe('character-first flow', () => {
    it('constrains the weapon pool to the assigned character and equips from it', async () => {
      const user = await setupTeamsPage();

      await pickCharacterFirst(user, CLAYMORE_USER);
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
    });

    it('empties the slot when the assigned character is picked again', async () => {
      const user = await setupTeamsPage();

      await pickCharacterFirst(user, CLAYMORE_USER);

      // Now assigned, so the same card offers removal.
      await user.click(
        await screen.findByRole('button', { name: `Remove ${CLAYMORE_USER.name} from team` }),
      );

      expect(useTeamStore.getState().teams[1].members[0]).toBeNull();
    });

    it('unequips the weapon when the equipped one is picked again', async () => {
      const user = await setupTeamsPage();

      await pickCharacterFirst(user, CLAYMORE_USER);
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
    });
  });

  it('drops a pending weapon when the same card is picked again', async () => {
    const user = await setupTeamsPage();

    await pickWeaponFirst(user, CLAYMORE);
    await user.click(
      await screen.findByRole('button', { name: `Remove ${CLAYMORE.name} from character` }),
    );

    await user.click(screen.getByRole('button', { name: 'Characters' }));

    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/users for/)).not.toBeInTheDocument();
  });

  // An empty member has no character, so the pool cannot tell that a weapon equipped
  // elsewhere belongs to the character about to be chosen. Reaching that pairing means
  // going character-first, where the weapon carries over on its own.
  it('withholds a weapon another team already equips, and names the way to it', async () => {
    const user = await setupTeamsPage();

    act(() => {
      useTeamStore.getState().assignCharacter(1, 0, CLAYMORE_USER.id);
      useTeamStore.getState().assignWeapon(1, 0, CLAYMORE_INSTANCE);
    });

    const teamTwo = screen.getByRole('region', { name: 'Team 2' });
    const [teamTwoMember] = within(teamTwo).getAllByRole('button', { name: /No character/ });
    if (!teamTwoMember) throw new Error('no empty member position in team 2');
    await user.click(teamTwoMember);
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));

    const card = await screen.findByRole('button', {
      name: `${CLAYMORE.name} is equipped by ${CLAYMORE_USER.name}`,
    });
    expect(card).toBeDisabled();
    expect(card).toHaveAccessibleDescription(
      `Pick ${CLAYMORE_USER.name} from Characters to bring it along.`,
    );
  });

  it('offers no character-first route on a member that already has a character', async () => {
    const user = await setupTeamsPage();

    act(() => {
      useTeamStore.getState().assignCharacter(1, 0, CLAYMORE_USER.id);
      useTeamStore.getState().assignWeapon(1, 0, CLAYMORE_INSTANCE);
      useTeamStore.getState().assignCharacter(2, 0, OTHER_CLAYMORE_USER.id);
    });

    const teamTwo = screen.getByRole('region', { name: 'Team 2' });
    await user.click(
      within(teamTwo).getByRole('button', { name: new RegExp(OTHER_CLAYMORE_USER.name) }),
    );
    await user.click(await screen.findByRole('button', { name: 'Weapons' }));

    const card = await screen.findByRole('button', {
      name: `${CLAYMORE.name} is equipped by ${CLAYMORE_USER.name}`,
    });
    expect(card).toBeDisabled();
    expect(card).not.toHaveAccessibleDescription();
  });

  it('forgets a pending weapon once the editor is closed', async () => {
    const user = await setupTeamsPage();

    await pickWeaponFirst(user, CLAYMORE);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(await firstEmptyMember());

    // Reopened on the same member, so a surviving weapon would still be constraining.
    expect(
      await screen.findByRole('button', { name: `Add ${BOW_USER.name} to team` }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/users for/)).not.toBeInTheDocument();
  });
});

describe('TeamsPage loading', () => {
  // An edit to a default slot would save over the user's team on the server.
  it('offers no team to edit until the saved teams load', async () => {
    const saved = makeTeam(1, {
      name: 'Abyss',
      members: [{ characterId: CLAYMORE_USER.id }, null, null, null],
    });
    const teams = holdResponse(() => HttpResponse.json(teamsDocument([saved])));
    server.use(
      http.get('http://localhost:8080/teams', teams.resolver),
      http.get('http://localhost:8080/characters', () =>
        HttpResponse.json(charactersDocument([makeCharacter(CLAYMORE_USER.id)])),
      ),
      http.get('http://localhost:8080/weapons', () => HttpResponse.json(weaponsDocument([]))),
    );

    renderTeamsPage(createWrapper({ user: fakeUser('user-1') }));
    await teams.arrived;

    expect(screen.getByText('Loading teams')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument();

    teams.release();

    expect(await screen.findByRole('button', { name: 'Edit Abyss' })).toBeInTheDocument();
  });

  it('reports a failed load in place of the teams, and recovers on retry', async () => {
    server.use(
      http.get('http://localhost:8080/teams', () => new HttpResponse(null, { status: 500 })),
      http.get('http://localhost:8080/characters', () => HttpResponse.json(charactersDocument([]))),
      http.get('http://localhost:8080/weapons', () => HttpResponse.json(weaponsDocument([]))),
    );
    const user = userEvent.setup({ delay: null });

    renderTeamsPage(createWrapper({ user: fakeUser('user-1') }));

    expect(await screen.findByText('Failed to load your teams.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Edit / })).not.toBeInTheDocument();

    server.use(
      http.get('http://localhost:8080/teams', () =>
        HttpResponse.json(teamsDocument([makeTeam(1, { name: 'Abyss' })])),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('button', { name: 'Edit Abyss' })).toBeInTheDocument();
  });
});

describe('TeamsPage empty collection', () => {
  // A collection belongs to an account, so the characters page can't fill one signed out.
  it('offers sign-in to a signed-out visitor', () => {
    renderTeamsPage();

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to Characters' })).not.toBeInTheDocument();
  });

  it('withholds the prompt until the collection has loaded', () => {
    renderTeamsPage(AuthLoading);

    expect(screen.queryByRole('button', { name: 'Sign in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Go to Characters' })).not.toBeInTheDocument();
  });

  it('shows no prompt once the user owns a character', async () => {
    await setupTeamsPage();

    expect(screen.queryByRole('link', { name: 'Go to Characters' })).not.toBeInTheDocument();
  });
});
