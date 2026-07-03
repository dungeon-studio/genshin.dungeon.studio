// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { migratePersistedCollection } from './index';

const TS = '2026-01-01T00:00:00.000Z';

function entry(characterId: string, constellationLevel = 0) {
  return { characterId, constellationLevel, createdAt: TS, updatedAt: TS };
}

describe('migratePersistedCollection', () => {
  it('adopts a valid unversioned collection', () => {
    const result = migratePersistedCollection({ characters: { amber: entry('amber', 2) } });

    expect(result.characters['amber'].constellationLevel).toBe(2);
  });

  it('discards a structurally invalid blob', () => {
    expect(migratePersistedCollection({ characters: 'nope' }).characters).toEqual({});
    expect(migratePersistedCollection(null).characters).toEqual({});
    expect(migratePersistedCollection(undefined).characters).toEqual({});
  });

  it('drops entries for unknown characters while keeping valid ones', () => {
    const result = migratePersistedCollection({
      characters: { amber: entry('amber', 1), 'not-a-character': entry('not-a-character', 1) },
    });

    expect(result.characters['amber']).toBeDefined();
    expect(result.characters['not-a-character']).toBeUndefined();
  });

  it('drops entries whose constellation level is out of range', () => {
    const result = migratePersistedCollection({ characters: { amber: entry('amber', 99) } });

    expect(result.characters['amber']).toBeUndefined();
  });
});
