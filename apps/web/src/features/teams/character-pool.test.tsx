// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ISOTimestamp } from '@genshin/domain';
import type { Character, WeaponType } from '@genshin/game-data';
import { CHARACTERS } from '@genshin/game-data';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CharacterCollection } from '@/features/collection/characters/use-character-collection-store';

import { CharacterPool } from './character-pool';
import { useTeamStore } from './use-team-store';

// The pool draws from real game data, so fixtures have to be real characters.
function characterWielding(weaponType: WeaponType): Character {
  const character = CHARACTERS.find((c) => c.weaponType === weaponType);
  if (!character) throw new Error(`no ${weaponType} user in game data`);
  return character;
}

const BOW_USER = characterWielding('Bow');
const CLAYMORE_USER = characterWielding('Claymore');

function owned(...characters: Character[]): CharacterCollection {
  return Object.fromEntries(
    characters.map((c) => [
      c.id,
      {
        characterId: c.id,
        constellationLevel: 0,
        createdAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
        updatedAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
      },
    ]),
  );
}

describe('CharacterPool', () => {
  beforeEach(() => {
    useTeamStore.getState().resetTeams();
  });

  it('offers every owned character when unconstrained', () => {
    render(
      <CharacterPool
        characters={owned(BOW_USER, CLAYMORE_USER)}
        slot={1}
        memberIndex={0}
        onAssign={vi.fn()}
      />,
    );

    expect(screen.getByText(BOW_USER.name)).toBeInTheDocument();
    expect(screen.getByText(CLAYMORE_USER.name)).toBeInTheDocument();
  });

  it('hides characters that cannot wield the constraining weapon type', () => {
    render(
      <CharacterPool
        characters={owned(BOW_USER, CLAYMORE_USER)}
        slot={1}
        memberIndex={0}
        weaponType="Claymore"
        onAssign={vi.fn()}
      />,
    );

    expect(screen.getByText(CLAYMORE_USER.name)).toBeInTheDocument();
    expect(screen.queryByText(BOW_USER.name)).not.toBeInTheDocument();
  });
});
