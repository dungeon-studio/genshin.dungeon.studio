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
import { assertCollectionTeam, MAX_TEAM_SLOT } from '../../collectionTeam.js';

const TEAM_TEMPLATE: Template = {
  data: [
    { name: 'name', prompt: 'Team name (1-50 characters)' },
    { name: 'description', prompt: 'Team description (optional, max 200 characters)' },
    {
      name: 'members',
      prompt: `Team members (0-${MAX_TEAM_SLOT} members as JSON; partial teams are valid)`,
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
    { name: 'description', value: team.description ?? '' },
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

export function deserialiseTeam(item: Item): CollectionTeam {
  const data = Object.fromEntries(
    item.data.map((d) => [d.name, d.name === 'members' ? JSON.parse(d.value as string) : d.value]),
  );
  assertCollectionTeam(data);
  return data;
}

export const teamRepresentation = {
  serialise: serialiseTeam,
  deserialise: deserialiseTeam,
  template: TEAM_TEMPLATE,
} satisfies CollectionJsonRepresentation<CollectionTeam>;
