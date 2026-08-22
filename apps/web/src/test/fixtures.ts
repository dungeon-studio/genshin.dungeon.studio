// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionDocument } from '@genshin/collection-json';
import type { CollectionCharacter, CollectionTeam, CollectionWeapon } from '@genshin/domain';
import * as testing from '@genshin/domain/testing';

export { makeCharacter, makeTeam, makeWeapon } from '@genshin/domain/testing';

// Origin the API client resolves relative paths against (see vitest.config.ts).
const API_BASE_URL = 'http://localhost:8080';

export function charactersDocument(characters: CollectionCharacter[]): CollectionDocument {
  return testing.charactersDocument(characters, API_BASE_URL);
}

export function weaponsDocument(weapons: CollectionWeapon[]): CollectionDocument {
  return testing.weaponsDocument(weapons, API_BASE_URL);
}

export function teamsDocument(teams: CollectionTeam[]): CollectionDocument {
  return testing.teamsDocument(teams, API_BASE_URL);
}
