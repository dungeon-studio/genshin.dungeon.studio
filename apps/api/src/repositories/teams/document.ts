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

export function fromDocument(slot: TeamSlot, raw: Record<string, unknown>): CollectionTeam {
  const result = entity.safeParse(raw);
  if (result.type !== 'ok') {
    throw new TypeError(`Invalid team document: ${result.error.type}`);
  }
  const data = result.value;
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
