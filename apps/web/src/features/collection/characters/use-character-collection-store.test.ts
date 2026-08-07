// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import { mergeCollections, useCollectionStore } from './use-character-collection-store';

function makeCharacter(id: CharacterId, constellationLevel = 0): CollectionCharacter {
  return {
    characterId: id,
    constellationLevel,
    createdAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
    updatedAt: '2026-01-01T00:00:00.000Z' as ISOTimestamp,
  };
}

describe('useCollectionStore', () => {
  beforeEach(() => {
    useCollectionStore.getState().clearCharacters();
  });

  describe('addCharacter', () => {
    it('adds a character with minimum constellation level', () => {
      useCollectionStore.getState().addCharacter('amber');

      expect(useCollectionStore.getState().characters).toMatchObject({
        amber: { constellationLevel: 0 },
      });
    });

    it('does not overwrite an existing character', () => {
      useCollectionStore.getState().addCharacter('amber');
      const original = useCollectionStore.getState().characters['amber'];

      useCollectionStore.getState().addCharacter('amber');
      const after = useCollectionStore.getState().characters['amber'];

      expect(original).toBeDefined();
      expect(after).toEqual(original);
    });
  });

  describe('removeCharacter', () => {
    it('removes a character from the collection', () => {
      useCollectionStore.getState().addCharacter('amber');
      useCollectionStore.getState().removeCharacter('amber');

      expect(useCollectionStore.getState().characters['amber']).toBeUndefined();
    });

    it('is a no-op for nonexistent characters', () => {
      useCollectionStore.getState().removeCharacter('zhongli');

      expect(Object.keys(useCollectionStore.getState().characters)).toHaveLength(0);
    });
  });

  describe('setConstellationLevel', () => {
    it('updates the constellation level of an owned character', () => {
      useCollectionStore.getState().addCharacter('amber');
      useCollectionStore.getState().setConstellationLevel('amber', 3);

      expect(useCollectionStore.getState().characters).toMatchObject({
        amber: { constellationLevel: 3 },
      });
    });

    it('ignores invalid constellation levels', () => {
      useCollectionStore.getState().addCharacter('amber');
      useCollectionStore.getState().setConstellationLevel('amber', -1);
      useCollectionStore.getState().setConstellationLevel('amber', 7);

      expect(useCollectionStore.getState().characters).toMatchObject({
        amber: { constellationLevel: 0 },
      });
    });

    it('ignores updates for characters not in the collection', () => {
      useCollectionStore.getState().setConstellationLevel('zhongli', 3);

      expect(useCollectionStore.getState().characters['zhongli']).toBeUndefined();
    });
  });

  describe('isOwned', () => {
    it('returns true for owned characters', () => {
      useCollectionStore.getState().addCharacter('amber');

      expect(useCollectionStore.getState().isOwned('amber')).toBe(true);
    });

    it('returns false for unowned characters', () => {
      expect(useCollectionStore.getState().isOwned('amber')).toBe(false);
    });
  });

  describe('replaceCharacters', () => {
    it('replaces the entire collection', () => {
      useCollectionStore.getState().addCharacter('amber');
      useCollectionStore.getState().replaceCharacters({ xiangling: makeCharacter('xiangling') });

      expect(useCollectionStore.getState().characters['amber']).toBeUndefined();
      expect(useCollectionStore.getState().characters['xiangling']).toBeDefined();
    });
  });

  describe('clearCharacters', () => {
    it('empties the collection', () => {
      useCollectionStore.getState().addCharacter('amber');
      useCollectionStore.getState().addCharacter('xiangling');
      useCollectionStore.getState().clearCharacters();

      expect(Object.keys(useCollectionStore.getState().characters)).toHaveLength(0);
    });
  });
});

describe('mergeCollections', () => {
  it('unions local and server collections', () => {
    const local = { amber: makeCharacter('amber') };
    const server = { xiangling: makeCharacter('xiangling') };

    const merged = mergeCollections(local, server);

    expect(merged['amber']).toBeDefined();
    expect(merged['xiangling']).toBeDefined();
  });

  it('keeps the higher constellation level on conflict', () => {
    const local = { amber: makeCharacter('amber', 3) };
    const server = { amber: makeCharacter('amber', 1) };

    const merged = mergeCollections(local, server);

    expect(merged).toMatchObject({ amber: { constellationLevel: 3 } });
  });

  it('keeps server value when server constellation is higher', () => {
    const local = { amber: makeCharacter('amber', 1) };
    const server = { amber: makeCharacter('amber', 5) };

    const merged = mergeCollections(local, server);

    expect(merged).toMatchObject({ amber: { constellationLevel: 5 } });
  });

  it('returns server collection when local is empty', () => {
    const server = { amber: makeCharacter('amber', 2) };

    const merged = mergeCollections({}, server);

    expect(merged).toEqual(server);
  });
});
