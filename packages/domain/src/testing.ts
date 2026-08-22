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

import { buildCollection, type CollectionDocument } from '@genshin/collection-json';

import type {
  CharacterId,
  CollectionCharacter,
  ConstellationLevel,
} from './character/collection-character.js';
import type { ISOTimestamp } from './iso-timestamp.js';
import {
  serialiseCharacter,
  characterCollectionHref,
} from './representations/collection-json/characters.js';
import { serialiseTeam, teamCollectionHref } from './representations/collection-json/teams.js';
import {
  serialiseWeapon,
  weaponCollectionHref,
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
  constellationLevel: ConstellationLevel = 0,
): CollectionCharacter {
  return {
    characterId,
    constellationLevel,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  };
}

export function makeWeapon(
  weaponInstanceId: CollectionWeaponId,
  weaponId: CollectionWeapon['weaponId'],
  refinementLevel = 1,
): CollectionWeapon {
  return {
    weaponInstanceId,
    weaponId,
    refinementLevel,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
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

export function charactersDocument(
  characters: CollectionCharacter[],
  baseUrl: string,
): CollectionDocument {
  return buildCollection(
    characterCollectionHref(baseUrl),
    characters.map((character) => serialiseCharacter(character, baseUrl)),
  );
}

export function weaponsDocument(weapons: CollectionWeapon[], baseUrl: string): CollectionDocument {
  return buildCollection(
    weaponCollectionHref(baseUrl),
    weapons.map((weapon) => serialiseWeapon(weapon, baseUrl)),
  );
}

export function teamsDocument(teams: CollectionTeam[], baseUrl: string): CollectionDocument {
  return buildCollection(
    teamCollectionHref(baseUrl),
    teams.map((team) => serialiseTeam(team, baseUrl)),
  );
}
