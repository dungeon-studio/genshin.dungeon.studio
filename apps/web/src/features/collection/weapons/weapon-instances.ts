// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionWeapon } from '@genshin/domain';
import type { WeaponId } from '@genshin/game-data';

export function weaponIdsOf(instances: Iterable<CollectionWeapon>): ReadonlySet<WeaponId> {
  return new Set(Array.from(instances, (instance) => instance.weaponId));
}

export function groupByWeapon(
  instances: readonly CollectionWeapon[],
): ReadonlyMap<WeaponId, readonly CollectionWeapon[]> {
  return new Map(
    Array.from(weaponIdsOf(instances), (id) => [id, instances.filter((i) => i.weaponId === id)]),
  );
}
