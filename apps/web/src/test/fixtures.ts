// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { buildCollection, type CollectionDocument } from '@genshin/collection-json';
import type {
  CharacterId,
  CollectionCharacter,
  CollectionTeam,
  CollectionWeapon,
  ConstellationLevel,
  ISOTimestamp,
  TeamSlot,
} from '@genshin/domain';
import {
  characterCollectionHref,
  createEmptyTeam,
  serialiseCharacter,
  serialiseTeam,
  serialiseWeapon,
  teamCollectionHref,
  weaponCollectionHref,
} from '@genshin/domain';
import type { WeaponId } from '@genshin/game-data';

// Origin the API client resolves relative paths against (see vitest.config.ts).
const API_BASE_URL = 'http://localhost:8080';

const FIXED_TIMESTAMP = '2026-01-01T00:00:00.000Z' as ISOTimestamp;

// Domain-object builders.
export function makeCharacter(
  id: CharacterId,
  constellationLevel: ConstellationLevel = 0,
): CollectionCharacter {
  return {
    characterId: id,
    constellationLevel,
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
  };
}

export function makeWeapon(
  instanceId: string,
  weaponId: WeaponId,
  refinementLevel = 1,
): CollectionWeapon {
  return {
    weaponInstanceId: instanceId,
    weaponId,
    refinementLevel,
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
  };
}

export function makeTeam(slot: TeamSlot, overrides: Partial<CollectionTeam> = {}): CollectionTeam {
  return {
    ...createEmptyTeam(slot),
    createdAt: FIXED_TIMESTAMP,
    updatedAt: FIXED_TIMESTAMP,
    ...overrides,
  };
}

// Collection+JSON envelope builders producing the wire format the hooks parse.
export function charactersDocument(characters: CollectionCharacter[]): CollectionDocument {
  return buildCollection(
    characterCollectionHref(API_BASE_URL),
    characters.map((character) => serialiseCharacter(character, API_BASE_URL)),
  );
}

export function weaponsDocument(weapons: CollectionWeapon[]): CollectionDocument {
  return buildCollection(
    weaponCollectionHref(API_BASE_URL),
    weapons.map((weapon) => serialiseWeapon(weapon, API_BASE_URL)),
  );
}

export function teamsDocument(teams: CollectionTeam[]): CollectionDocument {
  return buildCollection(
    teamCollectionHref(API_BASE_URL),
    teams.map((team) => serialiseTeam(team, API_BASE_URL)),
  );
}
