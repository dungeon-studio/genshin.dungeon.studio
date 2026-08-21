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

import type { ArtifactPlan } from '../../artifact/artifact-plan.js';
import { assertOptionalString, assertOptionalStringArray, assertString } from '../../assertions.js';
import type { CollectionTeamMember } from '../../team/collection-team-member.js';
import type { CollectionTeam, CollectionTeamMembers } from '../../team/collection-team.js';
import { assertCollectionTeam, MAX_TEAM_MEMBERS } from '../../team/collection-team.js';

const TEAM_TEMPLATE: Template = {
  data: [
    { name: 'name', prompt: 'Team name (1-50 characters)' },
    { name: 'description', prompt: 'Team description (optional, max 200 characters)' },
    {
      name: 'members',
      prompt: `Team members (exactly ${MAX_TEAM_MEMBERS} elements as JSON; null represents an empty position)`,
    },
  ],
};

export function teamCollectionHref(baseUrl: string): string {
  return `${baseUrl}/teams`;
}

export function teamItemHref(baseUrl: string, team: CollectionTeam): string {
  return `${teamCollectionHref(baseUrl)}/${team.slot}`;
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
    teamCollectionHref(baseUrl),
    teams.map((t) => serialiseTeam(t, baseUrl)),
    { template: TEAM_TEMPLATE },
  );
}

export function teamItemDocument(team: CollectionTeam, baseUrl: string): CollectionDocument {
  return buildCollection(teamItemHref(baseUrl, team), [serialiseTeam(team, baseUrl)], {
    template: TEAM_TEMPLATE,
  });
}

const MIN_MINOR_AFFIXES = 0;
const MAX_MINOR_AFFIXES = 3;

/** Every field carried across the wire; anything else is dropped on receipt. */
const ARTIFACT_PLAN_FIELDS = [
  'sands',
  'goblet',
  'circlet',
  'primarySetId',
  'secondarySetId',
  'priorityMinorAffixes',
  'secondaryMinorAffixes',
] as const;

/**
 * The wire format spells an absent list as `[]`, so unlike the domain guard
 * these arrays must be present.
 */
function assertStringArray(value: unknown, path: string, min: number, max: number): void {
  if (value === undefined) {
    throw new TypeError(`${path} must be an array, got: undefined`);
  }
  assertOptionalStringArray(value, path, min, max);
}

function deserialiseArtifactPlan(value: unknown): ArtifactPlan {
  if (value === null || typeof value !== 'object') {
    throw new TypeError(`artifactPlan must be a non-null object, got: ${JSON.stringify(value)}`);
  }
  const plan = value as Record<string, unknown>;
  assertString(plan.sands, 'artifactPlan.sands');
  assertString(plan.goblet, 'artifactPlan.goblet');
  assertString(plan.circlet, 'artifactPlan.circlet');
  assertString(plan.primarySetId, 'artifactPlan.primarySetId');
  assertOptionalString(plan.secondarySetId, 'artifactPlan.secondarySetId');
  for (const field of ['priorityMinorAffixes', 'secondaryMinorAffixes'] as const) {
    assertStringArray(plan[field], `artifactPlan.${field}`, MIN_MINOR_AFFIXES, MAX_MINOR_AFFIXES);
  }
  return Object.fromEntries(
    ARTIFACT_PLAN_FIELDS.filter((field) => plan[field] !== undefined).map((field) => [
      field,
      plan[field],
    ]),
  ) as ArtifactPlan;
}

function deserialiseCollectionTeamMember(value: unknown, index: number): CollectionTeamMember {
  if (value === null || typeof value !== 'object') {
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
  const member: CollectionTeamMember = {
    characterId: raw.characterId as CollectionTeamMember['characterId'],
  };
  if (raw.weaponInstanceId !== undefined) {
    member.weaponInstanceId = raw.weaponInstanceId;
  }
  if (raw.artifactPlan !== undefined) {
    member.artifactPlan = deserialiseArtifactPlan(raw.artifactPlan);
  }
  return member;
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
    throw new TypeError('members must be valid JSON', { cause: error });
  }
  if (!Array.isArray(members)) {
    throw new TypeError(`members must be an array, got: ${JSON.stringify(members)}`);
  }
  if (members.length !== MAX_TEAM_MEMBERS) {
    throw new TypeError(
      `members must have exactly ${MAX_TEAM_MEMBERS} elements, got: ${members.length}`,
    );
  }
  const data: Record<string, unknown> = Object.fromEntries(
    item.data.filter((d) => d.name !== 'members').map((d) => [d.name, d.value]),
  );
  const mapped = members.map((m: unknown, i: number) =>
    m === null ? null : deserialiseCollectionTeamMember(m, i),
  );
  data.members = [
    mapped[0] ?? null,
    mapped[1] ?? null,
    mapped[2] ?? null,
    mapped[3] ?? null,
  ] as CollectionTeamMembers;
  assertCollectionTeam(data);
  return data;
}

export const teamRepresentation = {
  serialise: serialiseTeam,
  deserialise: deserialiseTeam,
  template: TEAM_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionTeam>;
