// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  CollectionTeam,
  CollectionTeamMember,
  CollectionTeamMembers,
  ISOTimestamp,
  TeamSlot,
} from '@genshin/domain';
import { MAX_TEAM_MEMBERS } from '@genshin/domain';

export interface MemberDocumentData {
  characterId: string;
  weaponInstanceId?: string;
  artifactPlan?: {
    sands?: string;
    goblet?: string;
    circlet?: string;
    sets?: string[];
    priorityMinorAffixes?: string[];
    secondaryMinorAffixes?: string[];
  };
}

export interface DocumentData {
  name: string;
  members: (MemberDocumentData | null)[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

function memberFromDocument(m: MemberDocumentData): CollectionTeamMember {
  return {
    characterId: m.characterId,
    ...(m.weaponInstanceId ? { weaponInstanceId: m.weaponInstanceId } : {}),
    ...(m.artifactPlan ? { artifactPlan: m.artifactPlan } : {}),
  } as CollectionTeamMember;
}

function memberToDocument(m: CollectionTeamMember): MemberDocumentData {
  return {
    characterId: m.characterId,
    ...(m.weaponInstanceId ? { weaponInstanceId: m.weaponInstanceId } : {}),
    ...(m.artifactPlan ? { artifactPlan: m.artifactPlan } : {}),
  };
}

export function fromDocument(slot: TeamSlot, data: DocumentData): CollectionTeam {
  if (data.members.length > MAX_TEAM_MEMBERS) {
    throw new TypeError(
      `Document members must have at most ${MAX_TEAM_MEMBERS} entries, got: ${data.members.length}`,
    );
  }
  const mapped = data.members.map((m) => (m === null ? null : memberFromDocument(m)));
  return {
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
}

export function toDocument(team: CollectionTeam): DocumentData {
  return {
    name: team.name,
    members: team.members.map((m) => (m === null ? null : memberToDocument(m))),
    ...(team.description !== undefined ? { description: team.description } : {}),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}
