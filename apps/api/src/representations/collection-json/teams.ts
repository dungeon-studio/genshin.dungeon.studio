// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

/**
 * Team domain → Collection+JSON representation.
 *
 * Maps CollectionTeam domain objects to the collection+json wire format.
 * No framework dependencies — only domain types and collection+json builders.
 *
 * Team members are a nested structure that doesn't map cleanly to flat
 * collection+json data items. The members field is serialized as a JSON
 * string value for transport; clients parse it on receipt.
 */

import type { CollectionTeam } from '@genshin/types';

import {
  buildCollection,
  buildItem,
  type CollectionDocument,
  type CollectionJsonRepresentation,
  type Item,
  type Template,
} from '@genshin/collection-json';

const TEAM_TEMPLATE: Template = {
  data: [
    { name: 'name', prompt: 'Team name (1-50 characters)' },
    { name: 'description', prompt: 'Team description (optional, max 200 characters)' },
    {
      name: 'members',
      prompt: 'Team members (empty array to clear, or exactly 4 members as JSON)',
    },
  ],
};

export function teamToItem(team: CollectionTeam, baseUrl: string): Item {
  return buildItem(`${baseUrl}/api/teams/${team.slot}`, [
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
    teams.map((t) => teamToItem(t, baseUrl)),
    { template: TEAM_TEMPLATE },
  );
}

export function teamItemDocument(team: CollectionTeam, baseUrl: string): CollectionDocument {
  return buildCollection(`${baseUrl}/api/teams/${team.slot}`, [teamToItem(team, baseUrl)], {
    template: TEAM_TEMPLATE,
  });
}

// Compile-time enforcement: every required mapping function exists and has the right shape.
const _teamRepresentation = {
  toItem: teamToItem,
  listDocument: teamListDocument,
  itemDocument: teamItemDocument,
} satisfies CollectionJsonRepresentation<CollectionTeam>;
void _teamRepresentation;
