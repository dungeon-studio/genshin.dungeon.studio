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

import type { CollectionTeam } from '../../team/collection-team.js';
import {
  assertCollectionTeam,
  deserialiseCollectionTeamMembers,
  MAX_TEAM_MEMBERS,
} from '../../team/collection-team.js';

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

/**
 * One team as a whole document, for a response addressing a single slot.
 *
 * Collection+JSON has no single-item media type, so the document is a
 * collection holding one item, with the item's own URL as the collection href.
 */
export function teamItemDocument(team: CollectionTeam, baseUrl: string): CollectionDocument {
  return buildCollection(teamItemHref(baseUrl, team), [serialiseTeam(team, baseUrl)], {
    template: TEAM_TEMPLATE,
  });
}

function parseMembers(item: Item): unknown {
  const raw = item.data.find((d) => d.name === 'members');

  if (raw === undefined) {
    return [];
  }
  if (typeof raw.value !== 'string') {
    throw new TypeError(`members value must be a JSON string, got: ${typeof raw.value}`);
  }

  try {
    return JSON.parse(raw.value);
  } catch (error) {
    throw new TypeError('members must be valid JSON', { cause: error });
  }
}

/**
 * Reads a team back out of a Collection+JSON item, parsing `members` from its
 * transported JSON string.
 *
 * An item with no `members` entry fails the fixed-length check rather than
 * yielding an empty team, so a partial write can't quietly clear the roster.
 *
 * @throws TypeError naming the field that failed.
 */
export function deserialiseTeam(item: Item): CollectionTeam {
  const data: Record<string, unknown> = Object.fromEntries(
    item.data.filter((d) => d.name !== 'members').map((d) => [d.name, d.value]),
  );
  data.members = deserialiseCollectionTeamMembers(parseMembers(item));
  assertCollectionTeam(data);
  return data;
}

/** What the generic collection helpers consume for this resource. */
export const teamRepresentation = {
  serialise: serialiseTeam,
  deserialise: deserialiseTeam,
  template: TEAM_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionTeam>;
