// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { UUID } from '@genshin/domain';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as LoggerModule from '@/logger.js';

const lines: string[] = [];

// The repositories reach for the process-wide logger at import, so the
// destination has to be in place before they are pulled in.
vi.mock('@/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoggerModule>();
  return {
    ...actual,
    logger: actual.createLogger({
      level: 'info',
      destination: { write: (line: string) => lines.push(line) },
    }),
  };
});

const characters = await import('./characters/document.js');
const teams = await import('./teams/document.js');
const weapons = await import('./weapons/document.js');

const TIMESTAMP = '2024-01-15T12:00:00.000Z';
const WEAPON_INSTANCE_ID = '11111111-1111-1111-1111-111111111111' as UUID;

/** Each repository's document at its initial version, with the read that parses it. */
const REPOSITORIES = [
  {
    repository: 'characters',
    currentVersion: characters.CURRENT_VERSION,
    fields: { constellationLevel: 0, createdAt: TIMESTAMP, updatedAt: TIMESTAMP },
    read: (document: Record<string, unknown>) => characters.fromDocument('columbina', document),
  },
  {
    repository: 'teams',
    currentVersion: teams.CURRENT_VERSION,
    fields: {
      name: 'My Team',
      members: [null, null, null, null],
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    read: (document: Record<string, unknown>) => teams.fromDocument(1, document),
  },
  {
    repository: 'weapons',
    currentVersion: weapons.CURRENT_VERSION,
    fields: {
      weaponId: 'mistsplitter-reforged',
      refinementLevel: 1,
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    },
    read: (document: Record<string, unknown>) => weapons.fromDocument(WEAPON_INSTANCE_ID, document),
  },
];

function emitted(): unknown[] {
  return lines.map((line) => JSON.parse(line) as unknown);
}

beforeEach(() => {
  lines.length = 0;
});

describe('reading a document written before the current schema version', () => {
  it.each(REPOSITORIES)(
    'counts the migration in $repository',
    ({ currentVersion, fields, read, repository }) => {
      read(fields);

      expect(emitted()).toEqual([
        expect.objectContaining({ repository, fromVersion: 0, toVersion: currentVersion }),
      ]);
    },
  );

  it('says nothing about what the document held', () => {
    teams.fromDocument(1, {
      name: 'Childe Sundering Snowfall',
      members: [{ characterId: 'columbina' }, null, null, null],
      createdAt: TIMESTAMP,
      updatedAt: TIMESTAMP,
    });

    expect(lines.join('')).not.toMatch(/Childe|columbina/);
  });
});

describe('reading a document already at the current schema version', () => {
  it.each(REPOSITORIES)('stays quiet for $repository', ({ currentVersion, fields, read }) => {
    read({ ...fields, schemaVersion: currentVersion });

    expect(lines).toEqual([]);
  });
});
