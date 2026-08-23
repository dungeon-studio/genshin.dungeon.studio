// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CollectionTeam,
  CollectionTeamMember,
  CollectionTeamMembers,
  ISOTimestamp,
  TeamSlot,
} from '@genshin/domain';
import { assertCollectionTeam } from '@genshin/domain';

import { parseDocument } from '@/repositories/schema-version.js';

import {
  entity,
  CURRENT_VERSION,
  type V1Team,
  type V0Team,
  type V1Member,
} from './schemas/index.js';

export { CURRENT_VERSION, type V1Team, type V0Team };

function memberFromDocument(m: V1Member): CollectionTeamMember {
  return {
    characterId: m.characterId,
    ...(m.weaponInstanceId !== undefined ? { weaponInstanceId: m.weaponInstanceId } : {}),
    ...(m.artifactPlan !== undefined ? { artifactPlan: m.artifactPlan } : {}),
  } as CollectionTeamMember;
}

function memberToDocument(m: CollectionTeamMember): V1Member {
  return {
    characterId: m.characterId,
    ...(m.weaponInstanceId !== undefined ? { weaponInstanceId: m.weaponInstanceId } : {}),
    ...(m.artifactPlan !== undefined ? { artifactPlan: m.artifactPlan } : {}),
  };
}

/**
 * Reads a stored team, migrating it forward from whatever version it was
 * written in.
 *
 * The slot is the document key, so the caller passes it in rather than the
 * payload carrying it. The stored schemas cap `members` at four without
 * requiring four, so a shorter array is padded with empty positions to reach
 * the fixed-length tuple the domain type demands.
 *
 * @throws TypeError when no known version accepts the document, or when the
 * migrated result breaks a domain invariant.
 */
export function fromDocument(slot: TeamSlot, raw: Record<string, unknown>): CollectionTeam {
  const data = parseDocument('teams', entity, raw, CURRENT_VERSION);
  const mapped = data.members.map((m) => (m === null ? null : memberFromDocument(m)));
  const team = {
    slot,
    name: data.name,
    members: [
      mapped[0] ?? null,
      mapped[1] ?? null,
      mapped[2] ?? null,
      mapped[3] ?? null,
    ] as CollectionTeamMembers,
    ...(data.description !== undefined ? { description: data.description } : {}),
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
  assertCollectionTeam(team);
  return team;
}

/**
 * Writes a team in the current version, leaving the slot to the document key.
 *
 * Always stamps `CURRENT_VERSION`, so any read-modify-write upgrades a document
 * that was stored under an older one.
 */
export function toDocument(team: CollectionTeam): V1Team {
  return {
    schemaVersion: CURRENT_VERSION,
    name: team.name,
    members: team.members.map((m) => (m === null ? null : memberToDocument(m))),
    ...(team.description !== undefined ? { description: team.description } : {}),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}
