// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CharacterId,
  CollectionCharacter,
  CollectionTeam,
  CollectionWeapon,
  CollectionWeaponId,
  TeamSlot,
} from '@genshin/domain';

/**
 * Everything a transfer reads or writes, in the shape the zustand stores hold it.
 *
 * Taking a plain snapshot rather than the hooks keeps the export and import
 * logic free of React, and means both signed-in and signed-out callers hand over
 * the same structure — the stores are the read layer either way.
 */
export interface CollectionSnapshot {
  characters: Record<CharacterId, CollectionCharacter>;
  weapons: Record<CollectionWeaponId, CollectionWeapon>;
  teams: Record<TeamSlot, CollectionTeam>;
}

/** A team nobody has filled in carries no information worth transferring. */
export function isEmptyTeam(team: CollectionTeam): boolean {
  return team.members.every((member) => member === null);
}
