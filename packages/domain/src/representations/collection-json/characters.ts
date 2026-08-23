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

import type { CollectionCharacter } from '../../character/collection-character.js';
import {
  assertCollectionCharacter,
  MAX_CONSTELLATION_LEVEL,
  MIN_CONSTELLATION_LEVEL,
} from '../../character/collection-character.js';

const CHARACTER_TEMPLATE: Template = {
  data: [
    {
      name: 'constellationLevel',
      prompt: `Constellation level (${MIN_CONSTELLATION_LEVEL}-${MAX_CONSTELLATION_LEVEL})`,
    },
  ],
};

export function characterCollectionHref(baseUrl: string): string {
  return `${baseUrl}/characters`;
}

/**
 * The URL of one owned character.
 *
 * Addressed by `characterId`, so a user holds at most one record per character.
 * Owning several copies raises the constellation level rather than adding a
 * record, which is why no instance identifier appears here.
 */
export function characterItemHref(baseUrl: string, character: CollectionCharacter): string {
  return `${characterCollectionHref(baseUrl)}/${character.characterId}`;
}

export function serialiseCharacter(character: CollectionCharacter, baseUrl: string): Item {
  return buildItem(characterItemHref(baseUrl, character), [
    { name: 'characterId', value: character.characterId },
    { name: 'constellationLevel', value: character.constellationLevel },
    { name: 'createdAt', value: character.createdAt },
    { name: 'updatedAt', value: character.updatedAt },
  ]);
}

/**
 * Reads an owned character back out of a Collection+JSON item.
 *
 * Takes the identifier from the item's data rather than parsing its `href`, so
 * an item whose URL and payload disagree resolves to the payload.
 *
 * @throws TypeError naming the field that failed.
 */
export function deserialiseCharacter(item: Item): CollectionCharacter {
  const data = Object.fromEntries(item.data.map((d) => [d.name, d.value]));
  assertCollectionCharacter(data);
  return data;
}

/** The pair plus the write template, for a caller driving the format generically. */
export const characterRepresentation = {
  serialise: serialiseCharacter,
  deserialise: deserialiseCharacter,
  template: CHARACTER_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionCharacter>;
