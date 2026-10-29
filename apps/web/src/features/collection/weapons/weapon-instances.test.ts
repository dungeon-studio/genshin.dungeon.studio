// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { WEAPON_ROSTER } from '@genshin/game-data';
import { assert, describe, expect, it } from 'vitest';

import { makeWeapon } from '@/test/fixtures';

import { groupByWeapon } from './weapon-instances';

const [WEAPON, OTHER_WEAPON] = WEAPON_ROSTER;
assert.isDefined(WEAPON);
assert.isDefined(OTHER_WEAPON);

describe('groupByWeapon', () => {
  it('collects every instance under its weapon', () => {
    const first = makeWeapon('inst-1', WEAPON.id);
    const other = makeWeapon('inst-2', OTHER_WEAPON.id);
    const second = makeWeapon('inst-3', WEAPON.id);

    const groups = groupByWeapon([first, other, second]);

    expect(groups).toEqual(
      new Map([
        [WEAPON.id, [first, second]],
        [OTHER_WEAPON.id, [other]],
      ]),
    );
  });
});
