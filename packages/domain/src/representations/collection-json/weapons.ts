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

/** The URL of every weapon instance the user owns. */
export function weaponCollectionHref(baseUrl: string): string {
  return `${baseUrl}/weapons`;
}

/** The URL of the user's copies of one weapon, a filtered view of the collection. */
export function weaponsOfHref(baseUrl: string, weaponId: string): string {
  return `${weaponCollectionHref(baseUrl)}?weaponId=${encodeURIComponent(weaponId)}`;
}

export function weaponItemHref(baseUrl: string, weapon: CollectionWeapon): string {
  return `${weaponCollectionHref(baseUrl)}/${weapon.weaponInstanceId}`;
}

/**
 * Writes one owned weapon as a Collection+JSON item.
 *
 * Carries a `collection` link to the user's other copies of the same weapon,
 * so a client comparing refinements follows the link instead of filtering the
 * full list itself.
 */
export function serialiseWeapon(weapon: CollectionWeapon, baseUrl: string): Item {
  const links: Link[] = [
    {
      rel: 'collection',
      href: weaponsOfHref(baseUrl, weapon.weaponId),
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

/**
 * Reads one owned weapon back out of a Collection+JSON item.
 *
 * Takes the identifier from the item's data rather than parsing its `href`, so
 * an item whose URL and payload disagree resolves to the payload.
 *
 * @throws TypeError naming the field that failed.
 */
export function deserialiseWeapon(item: Item): CollectionWeapon {
  const data = Object.fromEntries(item.data.map((d) => [d.name, d.value]));
  assertCollectionWeapon(data);
  return data;
}

/** The pair plus the write template, for a caller driving the format generically. */
export const weaponRepresentation = {
  serialise: serialiseWeapon,
  deserialise: deserialiseWeapon,
  template: WEAPON_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionWeapon>;
