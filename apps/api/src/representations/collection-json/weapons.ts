// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Weapon domain → Collection+JSON representation.
 *
 * Maps CollectionWeapon domain objects to the collection+json wire format.
 * No framework dependencies — only domain types and collection+json builders.
 */

import type { CollectionWeapon } from '@genshin/types';
import { MAX_REFINEMENT_LEVEL, MIN_REFINEMENT_LEVEL } from '@genshin/types';

import {
  buildCollection,
  buildItem,
  type CollectionDocument,
  type CollectionJsonRepresentation,
  type Item,
  type Link,
  type Template,
} from '@genshin/collection-json';

const WEAPON_TEMPLATE: Template = {
  data: [
    {
      name: 'refinementLevel',
      prompt: `Refinement level (${MIN_REFINEMENT_LEVEL}-${MAX_REFINEMENT_LEVEL})`,
    },
  ],
};

function weaponItemHref(baseUrl: string, weapon: CollectionWeapon): string {
  return `${baseUrl}/api/weapons/${weapon.weaponId}/${weapon.weaponInstanceId}`;
}

export function weaponToItem(weapon: CollectionWeapon, baseUrl: string): Item {
  const links: Link[] = [
    {
      rel: 'collection',
      href: `${baseUrl}/api/weapons/${weapon.weaponId}`,
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

export function weaponListDocument(
  weapons: CollectionWeapon[],
  baseUrl: string,
): CollectionDocument {
  return buildCollection(
    `${baseUrl}/api/weapons`,
    weapons.map((w) => weaponToItem(w, baseUrl)),
    {
      template: WEAPON_TEMPLATE,
      queries: [
        {
          rel: 'search',
          href: `${baseUrl}/api/weapons`,
          prompt: 'Filter by weapon',
          data: [{ name: 'weaponId', prompt: 'Weapon ID' }],
        },
      ],
    },
  );
}

export function weaponInstanceListDocument(
  weapons: CollectionWeapon[],
  weaponId: string,
  baseUrl: string,
): CollectionDocument {
  return buildCollection(
    `${baseUrl}/api/weapons/${weaponId}`,
    weapons.map((w) => weaponToItem(w, baseUrl)),
    { template: WEAPON_TEMPLATE },
  );
}

export function weaponItemDocument(weapon: CollectionWeapon, baseUrl: string): CollectionDocument {
  return buildCollection(weaponItemHref(baseUrl, weapon), [weaponToItem(weapon, baseUrl)], {
    template: WEAPON_TEMPLATE,
  });
}

// Compile-time enforcement: every required mapping function exists and has the right shape.
// Resource-specific extras (weaponInstanceListDocument) live outside the contract.
const _weaponRepresentation = {
  toItem: weaponToItem,
  listDocument: weaponListDocument,
  itemDocument: weaponItemDocument,
} satisfies CollectionJsonRepresentation<CollectionWeapon>;
void _weaponRepresentation;
