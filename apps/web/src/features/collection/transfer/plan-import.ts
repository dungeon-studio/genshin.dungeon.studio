// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionWeaponId, TeamSlot } from '@genshin/domain';
import {
  isUUID,
  isValidConstellationLevel,
  isValidRefinementLevel,
  isValidTeamSlot,
  MAX_TEAM_MEMBERS,
} from '@genshin/domain';
import { getCharacterById, getWeaponById } from '@genshin/game-data';

import type { CollectionSnapshot } from './collection-snapshot.js';
import { isEmptyTeam } from './collection-snapshot.js';
import type { V1TransferCharacter, V1TransferTeam, V1TransferWeapon } from './schemas/v1.js';

/** An entry the import will not apply, with a reason the user can act on. */
export interface SkippedEntry {
  kind: 'character' | 'weapon' | 'team';
  label: string;
  reason: string;
}

export interface PlannedEntries<T> {
  create: T[];
  update: T[];
}

export interface ImportPlan {
  characters: PlannedEntries<V1TransferCharacter>;
  weapons: PlannedEntries<V1TransferWeapon>;
  teams: PlannedEntries<V1TransferTeam>;
  skipped: SkippedEntry[];
}

export function plannedCount(plan: ImportPlan): number {
  return (
    plan.characters.create.length +
    plan.characters.update.length +
    plan.weapons.create.length +
    plan.weapons.update.length +
    plan.teams.create.length +
    plan.teams.update.length
  );
}

/**
 * Decide what an envelope would do to the collection it is imported into.
 *
 * Entries are checked against the domain here rather than in the envelope schema
 * so a single unknown character or out-of-range level costs that one entry
 * instead of the whole file — the same tradeoff `migratePersistedCollection`
 * makes when rehydrating a persisted store.
 *
 * A team is "new" when the slot it claims is currently empty. Slots always
 * exist, so there is no such thing as an absent team to create.
 */
export function planImport(
  envelope: {
    characters: V1TransferCharacter[];
    weapons: V1TransferWeapon[];
    teams: V1TransferTeam[];
  },
  current: CollectionSnapshot,
): ImportPlan {
  const skipped: SkippedEntry[] = [];

  const characters: PlannedEntries<V1TransferCharacter> = { create: [], update: [] };
  for (const entry of envelope.characters) {
    if (!getCharacterById(entry.characterId)) {
      skipped.push({
        kind: 'character',
        label: entry.characterId,
        reason: 'not a character this version of the app knows',
      });
      continue;
    }
    if (!isValidConstellationLevel(entry.constellationLevel)) {
      skipped.push({
        kind: 'character',
        label: entry.characterId,
        reason: `constellation level ${String(entry.constellationLevel)} is out of range`,
      });
      continue;
    }

    const bucket = entry.characterId in current.characters ? characters.update : characters.create;
    bucket.push(entry);
  }

  const weapons: PlannedEntries<V1TransferWeapon> = { create: [], update: [] };
  for (const entry of envelope.weapons) {
    if (!isUUID(entry.weaponInstanceId)) {
      skipped.push({
        kind: 'weapon',
        label: entry.weaponId,
        reason: 'its identifier is not a UUID',
      });
      continue;
    }
    if (!getWeaponById(entry.weaponId)) {
      skipped.push({
        kind: 'weapon',
        label: entry.weaponId,
        reason: 'not a weapon this version of the app knows',
      });
      continue;
    }
    if (!isValidRefinementLevel(entry.refinementLevel)) {
      skipped.push({
        kind: 'weapon',
        label: entry.weaponId,
        reason: `refinement level ${String(entry.refinementLevel)} is out of range`,
      });
      continue;
    }

    const bucket = entry.weaponInstanceId in current.weapons ? weapons.update : weapons.create;
    bucket.push(entry);
  }

  const teams: PlannedEntries<V1TransferTeam> = { create: [], update: [] };
  for (const entry of envelope.teams) {
    if (!isValidTeamSlot(entry.slot)) {
      skipped.push({
        kind: 'team',
        label: entry.name,
        reason: `slot ${String(entry.slot)} is not a team slot`,
      });
      continue;
    }
    if (entry.members.length > MAX_TEAM_MEMBERS) {
      skipped.push({
        kind: 'team',
        label: entry.name,
        reason: `it holds ${String(entry.members.length)} members`,
      });
      continue;
    }

    const existing = current.teams[entry.slot];
    const bucket = existing && !isEmptyTeam(existing) ? teams.update : teams.create;
    bucket.push(entry);
  }

  return { characters, weapons, teams, skipped };
}

/**
 * Team members whose weapon is neither in the envelope nor already owned.
 *
 * Import writes weapons before teams, so a reference that survives this check
 * resolves by the time the team is written. One that does not would leave the
 * member pointing at nothing, so the reference is dropped and the member kept.
 */
export function resolveTeamMembers(
  team: V1TransferTeam,
  importedWeaponIds: ReadonlySet<string>,
  current: CollectionSnapshot,
): V1TransferTeam['members'] {
  return team.members.map((member) => {
    if (member === null) return null;
    if (member.weaponInstanceId === undefined) return member;

    const resolvable =
      importedWeaponIds.has(member.weaponInstanceId) || member.weaponInstanceId in current.weapons;
    if (resolvable) return member;

    const { weaponInstanceId: _dropped, ...withoutWeapon } = member;
    return withoutWeapon;
  });
}

/** Narrow the planner's loose ids to the branded types the write paths take. */
export const asCharacterId = (id: string): CharacterId => id as CharacterId;
export const asWeaponInstanceId = (id: string): CollectionWeaponId => id as CollectionWeaponId;
export const asTeamSlot = (slot: number): TeamSlot => slot as TeamSlot;
