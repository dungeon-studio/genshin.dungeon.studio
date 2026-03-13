// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionCharacter, ISOTimestamp } from '@genshin/types';

export interface DocumentData {
  constellationLevel: number;
  createdAt: string;
  updatedAt: string;
}

export function fromDocument(characterId: string, data: DocumentData): CollectionCharacter {
  return {
    characterId,
    constellationLevel: data.constellationLevel,
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
}

export function toDocument(character: CollectionCharacter): DocumentData {
  return {
    constellationLevel: character.constellationLevel,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt,
  };
}
