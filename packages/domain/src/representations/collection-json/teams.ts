// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Team domain ↔ Collection+JSON wire format.
 *
 * Bidirectional converters shared by API and web.
 * No framework dependencies — only domain types and collection+json builders.
 *
 * Team members are a nested structure that doesn't map cleanly to flat
 * collection+json data items. The members field is serialized as a JSON
 * string value for transport; clients parse it on receipt.
 */

import {
  buildCollection,
  buildItem,
  type CollectionDocument,
  type CollectionJsonRepresentation,
  type Item,
  type Template,
} from '@genshin/collection-json';

import type { CollectionTeam } from '../../collectionTeam.js';
import { MAX_TEAM_MEMBERS, assertCollectionTeam } from '../../collectionTeam.js';
import type { ArtifactPlan, TeamMember } from '../../teamMember.js';

const TEAM_TEMPLATE: Template = {
  data: [
    { name: 'name', prompt: 'Team name (1-50 characters)' },
    { name: 'description', prompt: 'Team description (optional, max 200 characters)' },
    {
      name: 'members',
      prompt: `Team members (0-${MAX_TEAM_MEMBERS} members as JSON; partial teams are valid)`,
    },
  ],
};

export function teamItemHref(baseUrl: string, team: CollectionTeam): string {
  return `${baseUrl}/api/teams/${team.slot}`;
}

export function serialiseTeam(team: CollectionTeam, baseUrl: string): Item {
  return buildItem(teamItemHref(baseUrl, team), [
    { name: 'slot', value: team.slot },
    { name: 'name', value: team.name },
    { name: 'members', value: JSON.stringify(team.members) },
    ...(team.description !== undefined ? [{ name: 'description', value: team.description }] : []),
    { name: 'createdAt', value: team.createdAt },
    { name: 'updatedAt', value: team.updatedAt },
  ]);
}

export function teamListDocument(teams: CollectionTeam[], baseUrl: string): CollectionDocument {
  return buildCollection(
    `${baseUrl}/api/teams`,
    teams.map((t) => serialiseTeam(t, baseUrl)),
    { template: TEAM_TEMPLATE },
  );
}

export function teamItemDocument(team: CollectionTeam, baseUrl: string): CollectionDocument {
  return buildCollection(`${baseUrl}/api/teams/${team.slot}`, [serialiseTeam(team, baseUrl)], {
    template: TEAM_TEMPLATE,
  });
}

function deserialiseArtifactPlan(value: unknown): ArtifactPlan {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(`artifactPlan must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const plan = value as Record<string, unknown>;
  for (const field of ['sands', 'goblet', 'circlet'] as const) {
    if (typeof plan[field] !== 'string') {
      throw new TypeError(
        `artifactPlan.${field} must be a string, got: ${JSON.stringify(plan[field])}`,
      );
    }
  }
  for (const field of ['sets', 'priorityMinorAffixes', 'secondaryMinorAffixes'] as const) {
    if (!Array.isArray(plan[field])) {
      throw new TypeError(
        `artifactPlan.${field} must be an array, got: ${JSON.stringify(plan[field])}`,
      );
    }
  }
  return value as ArtifactPlan;
}

function deserialiseTeamMember(value: unknown, index: number): TeamMember {
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(
      `members[${index}] must be a non-null object, got: ${JSON.stringify(value)}`,
    );
  }
  const raw = value as Record<string, unknown>;
  if (typeof raw.characterId !== 'string') {
    throw new TypeError(
      `members[${index}].characterId must be a string, got: ${JSON.stringify(raw.characterId)}`,
    );
  }
  if (raw.weaponInstanceId !== undefined && typeof raw.weaponInstanceId !== 'string') {
    throw new TypeError(
      `members[${index}].weaponInstanceId must be a string, got: ${JSON.stringify(raw.weaponInstanceId)}`,
    );
  }
  if (raw.artifactPlan !== undefined) {
    deserialiseArtifactPlan(raw.artifactPlan);
  }
  return value as TeamMember;
}

export function deserialiseTeam(item: Item): CollectionTeam {
  let members: unknown;
  try {
    const raw = item.data.find((d) => d.name === 'members');
    if (raw && typeof raw.value !== 'string') {
      throw new TypeError(`members value must be a JSON string, got: ${typeof raw.value}`);
    }
    members = raw ? JSON.parse(raw.value as string) : [];
  } catch (error) {
    if (error instanceof TypeError) throw error;
    throw new TypeError('members must be valid JSON');
  }
  if (!Array.isArray(members)) {
    throw new TypeError(`members must be an array, got: ${JSON.stringify(members)}`);
  }
  const data: Record<string, unknown> = Object.fromEntries(
    item.data.filter((d) => d.name !== 'members').map((d) => [d.name, d.value]),
  );
  data.members = members.map((m: unknown, i: number) => deserialiseTeamMember(m, i));
  assertCollectionTeam(data);
  return data;
}

export const teamRepresentation = {
  serialise: serialiseTeam,
  deserialise: deserialiseTeam,
  template: TEAM_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionTeam>;
