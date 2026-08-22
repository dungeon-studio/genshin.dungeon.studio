/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

/**
 * Literal test objects for the collection domain types, shared by API and web.
 *
 * Example and contract tests want stable, named values, so these are builders
 * rather than fast-check arbitraries: `fc.sample` is non-deterministic without
 * a fixed seed, and a test asserting on a value would have to override the
 * generated field anyway. Property-based suites keep their own arbitraries.
 *
 * Reachable from `@genshin/domain/testing` so a field added to a collection
 * type is answered here rather than in every suite that builds one.
 */

import {
  type CollectionDocument,
  type CollectionJsonRepresentation,
  serialiseCollection,
} from '@genshin/collection-json';

import type { CharacterId, CollectionCharacter } from './character/collection-character.js';
import type { ISOTimestamp } from './iso-timestamp.js';
import {
  characterCollectionHref,
  characterRepresentation,
} from './representations/collection-json/characters.js';
import { teamCollectionHref, teamRepresentation } from './representations/collection-json/teams.js';
import {
  weaponCollectionHref,
  weaponRepresentation,
} from './representations/collection-json/weapons.js';
import type { CollectionTeam, TeamSlot } from './team/collection-team.js';
import { createEmptyTeam } from './team/collection-team.js';
import type { CollectionWeapon, CollectionWeaponId } from './weapon/collection-weapon.js';

/**
 * Distinct by default so a serialiser that emits `createdAt` where `updatedAt`
 * belongs cannot pass a round-trip assertion.
 */
const CREATED_AT = '2026-01-01T00:00:00.000Z' as ISOTimestamp;
const UPDATED_AT = '2026-03-13T00:00:00.000Z' as ISOTimestamp;

export function makeCharacter(
  characterId: CharacterId,
  overrides: Partial<CollectionCharacter> = {},
): CollectionCharacter {
  return {
    characterId,
    constellationLevel: 0,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

export function makeWeapon(
  weaponInstanceId: CollectionWeaponId,
  weaponId: CollectionWeapon['weaponId'],
  overrides: Partial<CollectionWeapon> = {},
): CollectionWeapon {
  return {
    weaponInstanceId,
    weaponId,
    refinementLevel: 1,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

export function makeTeam(slot: TeamSlot, overrides: Partial<CollectionTeam> = {}): CollectionTeam {
  return {
    ...createEmptyTeam(slot),
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
    ...overrides,
  };
}

/**
 * Wrap entities in the collection envelope the routes serve.
 *
 * Goes through `serialiseCollection` rather than `buildCollection` so a fixture
 * carries the representation's template. A hand-rolled envelope omits it, and
 * the suites then parse a document the API never sends.
 */
function collectionDocument<T>(
  representation: CollectionJsonRepresentation<T>,
  collectionHref: (baseUrl: string) => string,
  entities: T[],
  baseUrl: string,
): CollectionDocument {
  return serialiseCollection(
    representation,
    collectionHref(baseUrl),
    entities.map((entity) => representation.serialise(entity, baseUrl)),
  );
}

export function charactersDocument(
  characters: CollectionCharacter[],
  baseUrl: string,
): CollectionDocument {
  return collectionDocument(characterRepresentation, characterCollectionHref, characters, baseUrl);
}

export function weaponsDocument(weapons: CollectionWeapon[], baseUrl: string): CollectionDocument {
  return collectionDocument(weaponRepresentation, weaponCollectionHref, weapons, baseUrl);
}

export function teamsDocument(teams: CollectionTeam[], baseUrl: string): CollectionDocument {
  return collectionDocument(teamRepresentation, teamCollectionHref, teams, baseUrl);
}
