// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, WeaponId } from '@genshin/game-data';
import { getCharacterById, getWeaponById } from '@genshin/game-data';
import { HTTPException } from 'hono/http-exception';

/** Narrows a request-supplied character ID to one the catalogue lists, or throws HTTP 400. */
export function requireCharacterId(characterId: string): CharacterId {
  const character = getCharacterById(characterId);
  if (!character) {
    throw new HTTPException(400, { message: `Unknown character: ${characterId}` });
  }
  return character.id;
}

/** Weapon counterpart of {@link requireCharacterId}. */
export function requireWeaponId(weaponId: string): WeaponId {
  const weapon = getWeaponById(weaponId);
  if (!weapon) {
    throw new HTTPException(400, { message: `Unknown weapon: ${weaponId}` });
  }
  return weapon.id;
}
