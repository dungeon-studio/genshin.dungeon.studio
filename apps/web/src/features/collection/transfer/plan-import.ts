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

/**
 * Entries that survived planning, in the types the write paths take.
 *
 * Envelope types stay loose because a file is untrusted. Planning is where an
 * entry is proven to be a known character, a real UUID, a valid slot, so these
 * carry that proof forward and callers write them without casting.
 */
export interface PlannedCharacter {
  characterId: CharacterId;
  constellationLevel: number;
}

export interface PlannedWeapon {
  weaponInstanceId: CollectionWeaponId;
  weaponId: string;
  refinementLevel: number;
}

export type TransferMembers = V1TransferTeam['members'];

export interface PlannedTeam {
  slot: TeamSlot;
  name: string;
  members: TransferMembers;
  description?: string;
}

export interface PlannedEntries<T> {
  create: T[];
  update: T[];
}

export interface ImportPlan {
  characters: PlannedEntries<PlannedCharacter>;
  weapons: PlannedEntries<PlannedWeapon>;
  teams: PlannedEntries<PlannedTeam>;
  skipped: SkippedEntry[];
}

interface PlannedKind<T> {
  entries: PlannedEntries<T>;
  skipped: SkippedEntry[];
}

export function plannedCount(plan: ImportPlan): number {
  return [plan.characters, plan.weapons, plan.teams].reduce(
    (total, { create, update }) => total + create.length + update.length,
    0,
  );
}

/**
 * Decide what an envelope would do to the collection it is imported into.
 *
 * Entries are checked against the domain here rather than in the envelope schema
 * so a single unknown character or out-of-range level costs that one entry
 * instead of the whole file — the same tradeoff `migratePersistedCollection`
 * makes when rehydrating a persisted store.
 */
export function planImport(
  envelope: {
    characters: V1TransferCharacter[];
    weapons: V1TransferWeapon[];
    teams: V1TransferTeam[];
  },
  current: CollectionSnapshot,
): ImportPlan {
  const characters = planCharacters(envelope.characters, current);
  const weapons = planWeapons(envelope.weapons, current);
  const teams = planTeams(envelope.teams, current);

  return {
    characters: characters.entries,
    weapons: weapons.entries,
    teams: teams.entries,
    skipped: [...characters.skipped, ...weapons.skipped, ...teams.skipped],
  };
}

function planCharacters(
  entries: V1TransferCharacter[],
  current: CollectionSnapshot,
): PlannedKind<PlannedCharacter> {
  const planned: PlannedEntries<PlannedCharacter> = { create: [], update: [] };
  const skipped: SkippedEntry[] = [];

  for (const entry of entries) {
    const skip = (reason: string) =>
      skipped.push({ kind: 'character', label: entry.characterId, reason });

    if (!getCharacterById(entry.characterId)) {
      skip('not a character this version of the app knows');
      continue;
    }
    if (!isValidConstellationLevel(entry.constellationLevel)) {
      skip(`constellation level ${String(entry.constellationLevel)} is out of range`);
      continue;
    }

    const owned = entry.characterId in current.characters;
    (owned ? planned.update : planned.create).push(entry);
  }

  return { entries: planned, skipped };
}

function planWeapons(
  entries: V1TransferWeapon[],
  current: CollectionSnapshot,
): PlannedKind<PlannedWeapon> {
  const planned: PlannedEntries<PlannedWeapon> = { create: [], update: [] };
  const skipped: SkippedEntry[] = [];

  for (const entry of entries) {
    const skip = (reason: string) =>
      skipped.push({ kind: 'weapon', label: entry.weaponId, reason });

    if (!isUUID(entry.weaponInstanceId)) {
      skip('its identifier is not a UUID');
      continue;
    }
    if (!getWeaponById(entry.weaponId)) {
      skip('not a weapon this version of the app knows');
      continue;
    }
    if (!isValidRefinementLevel(entry.refinementLevel)) {
      skip(`refinement level ${String(entry.refinementLevel)} is out of range`);
      continue;
    }

    const { weaponInstanceId } = entry;
    const owned = weaponInstanceId in current.weapons;
    (owned ? planned.update : planned.create).push({ ...entry, weaponInstanceId });
  }

  return { entries: planned, skipped };
}

/**
 * A team is "new" when the slot it claims is currently empty. Slots always
 * exist, so there is no such thing as an absent team to create.
 */
function planTeams(
  entries: V1TransferTeam[],
  current: CollectionSnapshot,
): PlannedKind<PlannedTeam> {
  const planned: PlannedEntries<PlannedTeam> = { create: [], update: [] };
  const skipped: SkippedEntry[] = [];

  for (const entry of entries) {
    const skip = (reason: string) => skipped.push({ kind: 'team', label: entry.name, reason });

    if (!isValidTeamSlot(entry.slot)) {
      skip(`slot ${String(entry.slot)} is not a team slot`);
      continue;
    }
    if (entry.members.length > MAX_TEAM_MEMBERS) {
      skip(`it holds ${String(entry.members.length)} members`);
      continue;
    }

    const { slot } = entry;
    const existing = current.teams[slot];
    const occupied = existing !== undefined && !isEmptyTeam(existing);
    (occupied ? planned.update : planned.create).push({ ...entry, slot });
  }

  return { entries: planned, skipped };
}

/**
 * Every member of `team`, with unresolvable weapon references dropped.
 *
 * Import writes weapons before teams, so a reference that survives this check
 * resolves by the time the team is written. One that does not would leave the
 * member pointing at nothing, so the reference goes and the member stays.
 */
export function resolveTeamMembers(
  team: PlannedTeam,
  importedWeaponIds: ReadonlySet<string>,
  current: CollectionSnapshot,
): TransferMembers {
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
