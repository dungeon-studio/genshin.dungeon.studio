// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { WEAPON_ROSTER } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';

import { useWeaponCollectionStore } from '@/features/collection/weapons/use-weapon-collection-store';
import { makeWeapon, weaponsDocument } from '@/test/fixtures';
import { server } from '@/test/msw/server';
import { createWrapper, fakeUser } from '@/test/render';

import { WeaponsPage } from './weapons-page';

const [WEAPON] = WEAPON_ROSTER;
if (!WEAPON) throw new Error('weapon roster is empty');

beforeEach(() => {
  useWeaponCollectionStore.getState().clearWeapons();
});

describe('WeaponsPage loading the collection', () => {
  it('reports a failed load in place of the roster, and recovers on retry', async () => {
    server.use(
      http.get('http://localhost:8080/weapons', () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup({ delay: null });

    render(
      <MemoryRouter>
        <WeaponsPage />
      </MemoryRouter>,
      { wrapper: createWrapper({ user: fakeUser('user-1') }) },
    );

    expect(await screen.findByText('Failed to load your weapon collection.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /owned$/ })).not.toBeInTheDocument();

    server.use(
      http.get('http://localhost:8080/weapons', () =>
        HttpResponse.json(weaponsDocument([makeWeapon('weapon-1', WEAPON.id)])),
      ),
    );
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(
      await screen.findByRole('button', { name: `${WEAPON.name}, 1 owned` }),
    ).toBeInTheDocument();
  });
});
