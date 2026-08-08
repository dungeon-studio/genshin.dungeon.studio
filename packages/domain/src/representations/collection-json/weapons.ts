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

import type { CollectionWeapon } from '../../weapon/collection-weapon.js';
import {
  assertCollectionWeapon,
  MAX_REFINEMENT_LEVEL,
  MIN_REFINEMENT_LEVEL,
} from '../../weapon/collection-weapon.js';

const WEAPON_TEMPLATE: Template = {
  data: [
    {
      name: 'refinementLevel',
      prompt: `Refinement level (${MIN_REFINEMENT_LEVEL}-${MAX_REFINEMENT_LEVEL})`,
    },
  ],
};

/**
 * The weapon collection, optionally narrowed to one weapon's instances.
 *
 * A player owns any number of instances of the same weapon, so the filtered
 * form is a first-class collection: it is what an item's `collection` link
 * points back to, and what the API serves for a `weaponId` query.
 */
export function weaponCollectionHref(baseUrl: string, weaponId?: string): string {
  const collection = `${baseUrl}/weapons`;
  if (weaponId === undefined) return collection;
  return `${collection}?weaponId=${encodeURIComponent(weaponId)}`;
}

export function weaponItemHref(baseUrl: string, weapon: CollectionWeapon): string {
  return `${weaponCollectionHref(baseUrl)}/${weapon.weaponInstanceId}`;
}

export function serialiseWeapon(weapon: CollectionWeapon, baseUrl: string): Item {
  const links: Link[] = [
    {
      rel: 'collection',
      href: weaponCollectionHref(baseUrl, weapon.weaponId),
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
