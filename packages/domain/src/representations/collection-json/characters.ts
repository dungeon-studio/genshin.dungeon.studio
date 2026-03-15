// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Character domain ↔ Collection+JSON wire format.
 *
 * Bidirectional converters shared by API and web.
 * No framework dependencies — only domain types and collection+json builders.
 */

import {
  buildItem,
  type CollectionJsonRepresentation,
  type Item,
  type Template,
} from '@genshin/collection-json';

import type { CollectionCharacter } from '../../collectionCharacter.js';
import {
  assertCollectionCharacter,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
} from '../../collectionCharacter.js';

const CHARACTER_TEMPLATE: Template = {
  data: [
    {
      name: 'constellationLevel',
      prompt: `Constellation level (${MIN_CONSTELLATION_LEVEL}-${MAX_CONSTELLATION_LEVEL})`,
    },
  ],
};

export function characterItemHref(baseUrl: string, character: CollectionCharacter): string {
  return `${baseUrl}/api/characters/${character.characterId}`;
}

export function serialiseCharacter(character: CollectionCharacter, baseUrl: string): Item {
  return buildItem(characterItemHref(baseUrl, character), [
    { name: 'characterId', value: character.characterId },
    { name: 'constellationLevel', value: character.constellationLevel },
    { name: 'createdAt', value: character.createdAt },
    { name: 'updatedAt', value: character.updatedAt },
  ]);
}

export function deserialiseCharacter(item: Item): CollectionCharacter {
  const data = Object.fromEntries(item.data.map((d) => [d.name, d.value]));
  assertCollectionCharacter(data);
  return data;
}

export const characterRepresentation = {
  serialise: serialiseCharacter,
  deserialise: deserialiseCharacter,
  template: CHARACTER_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionCharacter>;
