// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CollectionTeam, ISOTimestamp, TeamSlot } from '@genshin/types';

export interface MemberDocumentData {
  characterId: string;
  weaponInstanceId: string;
  artifactPlan?: {
    sands: string;
    goblet: string;
    circlet: string;
    sets: string[];
    primaryStats: string[];
    secondaryStats: string[];
  };
}

export interface DocumentData {
  name: string;
  members: MemberDocumentData[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export function fromDocument(slot: TeamSlot, data: DocumentData): CollectionTeam {
  return {
    slot,
    name: data.name,
    members: data.members.map((m) => ({
      characterId: m.characterId,
      weaponInstanceId: m.weaponInstanceId,
      ...(m.artifactPlan ? { artifactPlan: m.artifactPlan } : {}),
    })) as CollectionTeam['members'],
    ...(data.description ? { description: data.description } : {}),
    createdAt: data.createdAt as ISOTimestamp,
    updatedAt: data.updatedAt as ISOTimestamp,
  };
}

export function toDocument(team: CollectionTeam): DocumentData {
  return {
    name: team.name,
    members: team.members.map((m) => ({
      characterId: m.characterId,
      weaponInstanceId: m.weaponInstanceId,
      ...(m.artifactPlan ? { artifactPlan: m.artifactPlan } : {}),
    })),
    ...(team.description ? { description: team.description } : {}),
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
  };
}
