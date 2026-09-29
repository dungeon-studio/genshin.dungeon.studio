// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { WEAPON_ROSTER } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { makeWeapon } from '@/test/fixtures';

import { useTeamStore } from './use-team-store';
import { WeaponPool } from './weapon-pool';

const BOW = WEAPON_ROSTER.find((w) => w.type === 'Bow');
if (!BOW) throw new Error('no Bow in game data');

function renderPool(props: Partial<Parameters<typeof WeaponPool>[0]>) {
  return render(
    <MemoryRouter>
      <WeaponPool
        collectionWeapons={[]}
        slot={1}
        memberIndex={0}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('WeaponPool', () => {
  beforeEach(() => {
    useTeamStore.getState().resetTeams();
  });

  it('sends a user with no weapons to the whole weapons page', () => {
    renderPool({});

    expect(screen.getByText('No weapons in your collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Weapons' })).toHaveAttribute('href', '/weapons');
  });

  it('sends a user lacking the member’s weapon type to that type on the weapons page', () => {
    renderPool({
      collectionWeapons: [makeWeapon('instance-1', BOW.id)],
      weaponType: 'Sword',
    });

    expect(screen.getByText('No Sword weapons in your collection')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Weapons' })).toHaveAttribute(
      'href',
      '/weapons?type=Sword',
    );
  });
});
