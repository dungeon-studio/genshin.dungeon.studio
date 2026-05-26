// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Weapon domain ↔ Collection+JSON wire format.
 *
 * Bidirectional converters shared by API and web.
 * No framework dependencies — only domain types and collection+json builders.
 */

import {
  buildItem,
  type CollectionJsonRepresentation,
  type Item,
  type Link,
  type Template,
} from '@genshin/collection-json';

import type { CollectionWeapon } from '../../collection-weapon.js';
import {
  assertCollectionWeapon,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
} from '../../collection-weapon.js';

const WEAPON_TEMPLATE: Template = {
  data: [
    {
      name: 'refinementLevel',
      prompt: `Refinement level (${MIN_REFINEMENT_LEVEL}-${MAX_REFINEMENT_LEVEL})`,
    },
  ],
};

export function weaponItemHref(baseUrl: string, weapon: CollectionWeapon): string {
  return `${baseUrl}/api/weapons/${weapon.weaponInstanceId}`;
}

export function serialiseWeapon(weapon: CollectionWeapon, baseUrl: string): Item {
  const links: Link[] = [
    {
      rel: 'collection',
      href: `${baseUrl}/api/weapons?weaponId=${encodeURIComponent(weapon.weaponId)}`,
      prompt: `All instances of ${weapon.weaponId}`,
    },
  ];

  return buildItem(
    weaponItemHref(baseUrl, weapon),
    [
      { name: 'weaponInstanceId', value: weapon.weaponInstanceId },
      { name: 'weaponId', value: weapon.weaponId },
      { name: 'refinementLevel', value: weapon.refinementLevel },
      { name: 'createdAt', value: weapon.createdAt },
      { name: 'updatedAt', value: weapon.updatedAt },
    ],
    links,
  );
}

export function deserialiseWeapon(item: Item): CollectionWeapon {
  const data = Object.fromEntries(item.data.map((d) => [d.name, d.value]));
  assertCollectionWeapon(data);
  return data;
}

export const weaponRepresentation = {
  serialise: serialiseWeapon,
  deserialise: deserialiseWeapon,
  template: WEAPON_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionWeapon>;
