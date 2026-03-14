// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Character domain → Collection+JSON representation.
 *
 * Maps CollectionCharacter domain objects to the collection+json wire format.
 * No framework dependencies — only domain types and collection+json builders.
 */

import type { CollectionCharacter } from '@genshin/types';
import { MAX_CONSTELLATION_LEVEL, MIN_CONSTELLATION_LEVEL } from '@genshin/types';

import {
  buildCollection,
  buildItem,
  type CollectionDocument,
  type CollectionJsonRepresentation,
  type Item,
  type Template,
} from '@genshin/collection-json';

const CHARACTER_TEMPLATE: Template = {
  data: [
    {
      name: 'constellationLevel',
      prompt: `Constellation level (${MIN_CONSTELLATION_LEVEL}-${MAX_CONSTELLATION_LEVEL})`,
    },
  ],
};

export function characterToItem(character: CollectionCharacter, baseUrl: string): Item {
  return buildItem(`${baseUrl}/api/characters/${character.characterId}`, [
    { name: 'characterId', value: character.characterId },
    { name: 'constellationLevel', value: character.constellationLevel },
    { name: 'createdAt', value: character.createdAt },
    { name: 'updatedAt', value: character.updatedAt },
  ]);
}

export function characterListDocument(
  characters: CollectionCharacter[],
  baseUrl: string,
): CollectionDocument {
  return buildCollection(
    `${baseUrl}/api/characters`,
    characters.map((c) => characterToItem(c, baseUrl)),
    { template: CHARACTER_TEMPLATE },
  );
}

export function characterItemDocument(
  character: CollectionCharacter,
  baseUrl: string,
): CollectionDocument {
  return buildCollection(
    `${baseUrl}/api/characters/${character.characterId}`,
    [characterToItem(character, baseUrl)],
    { template: CHARACTER_TEMPLATE },
  );
}

// Compile-time enforcement: every required mapping function exists and has the right shape.
const _characterRepresentation = {
  toItem: characterToItem,
  listDocument: characterListDocument,
  itemDocument: characterItemDocument,
} satisfies CollectionJsonRepresentation<CollectionCharacter>;
void _characterRepresentation;
