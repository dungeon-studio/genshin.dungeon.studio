// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId, CollectionCharacter, ISOTimestamp } from '@genshin/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import { mergeCollections, useCollectionStore } from './useCharacterCollectionStore';

function makeCharacter(id: string, constellationLevel = 0): CollectionCharacter {
  return {
    characterId: id as CharacterId,
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
      useCollectionStore.getState().addCharacter('amber' as CharacterId);

      const entry = useCollectionStore.getState().characters['amber'];
      expect(entry).toBeDefined();
      expect(entry.constellationLevel).toBe(0);
    });

    it('does not overwrite an existing character', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      const original = useCollectionStore.getState().characters['amber'];

      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      const after = useCollectionStore.getState().characters['amber'];

      expect(after.createdAt).toBe(original.createdAt);
    });
  });

  describe('removeCharacter', () => {
    it('removes a character from the collection', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      useCollectionStore.getState().removeCharacter('amber' as CharacterId);

      expect(useCollectionStore.getState().characters['amber']).toBeUndefined();
    });

    it('is a no-op for nonexistent characters', () => {
      useCollectionStore.getState().removeCharacter('nonexistent' as CharacterId);

      expect(Object.keys(useCollectionStore.getState().characters)).toHaveLength(0);
    });
  });

  describe('setConstellationLevel', () => {
    it('updates the constellation level of an owned character', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      useCollectionStore.getState().setConstellationLevel('amber' as CharacterId, 3);

      expect(useCollectionStore.getState().characters['amber'].constellationLevel).toBe(3);
    });

    it('ignores invalid constellation levels', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      useCollectionStore.getState().setConstellationLevel('amber' as CharacterId, -1);
      useCollectionStore.getState().setConstellationLevel('amber' as CharacterId, 7);

      expect(useCollectionStore.getState().characters['amber'].constellationLevel).toBe(0);
    });

    it('ignores updates for characters not in the collection', () => {
      useCollectionStore.getState().setConstellationLevel('missing' as CharacterId, 3);

      expect(useCollectionStore.getState().characters['missing']).toBeUndefined();
    });
  });

  describe('isOwned', () => {
    it('returns true for owned characters', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);

      expect(useCollectionStore.getState().isOwned('amber' as CharacterId)).toBe(true);
    });

    it('returns false for unowned characters', () => {
      expect(useCollectionStore.getState().isOwned('amber' as CharacterId)).toBe(false);
    });
  });

  describe('replaceCharacters', () => {
    it('replaces the entire collection', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      useCollectionStore
        .getState()
        .replaceCharacters({ xiangling: makeCharacter('xiangling') } as Record<
          CharacterId,
          CollectionCharacter
        >);

      expect(useCollectionStore.getState().characters['amber']).toBeUndefined();
      expect(useCollectionStore.getState().characters['xiangling']).toBeDefined();
    });
  });

  describe('clearCharacters', () => {
    it('empties the collection', () => {
      useCollectionStore.getState().addCharacter('amber' as CharacterId);
      useCollectionStore.getState().addCharacter('xiangling' as CharacterId);
      useCollectionStore.getState().clearCharacters();

      expect(Object.keys(useCollectionStore.getState().characters)).toHaveLength(0);
    });
  });
});

describe('mergeCollections', () => {
  it('unions local and server collections', () => {
    const local = { amber: makeCharacter('amber') } as Record<CharacterId, CollectionCharacter>;
    const server = { xiangling: makeCharacter('xiangling') } as Record<
      CharacterId,
      CollectionCharacter
    >;

    const merged = mergeCollections(local, server);

    expect(merged['amber']).toBeDefined();
    expect(merged['xiangling']).toBeDefined();
  });

  it('keeps the higher constellation level on conflict', () => {
    const local = { amber: makeCharacter('amber', 3) } as Record<CharacterId, CollectionCharacter>;
    const server = { amber: makeCharacter('amber', 1) } as Record<CharacterId, CollectionCharacter>;

    const merged = mergeCollections(local, server);

    expect(merged['amber'].constellationLevel).toBe(3);
  });

  it('keeps server value when server constellation is higher', () => {
    const local = { amber: makeCharacter('amber', 1) } as Record<CharacterId, CollectionCharacter>;
    const server = { amber: makeCharacter('amber', 5) } as Record<CharacterId, CollectionCharacter>;

    const merged = mergeCollections(local, server);

    expect(merged['amber'].constellationLevel).toBe(5);
  });

  it('returns server collection when local is empty', () => {
    const server = { amber: makeCharacter('amber', 2) } as Record<CharacterId, CollectionCharacter>;

    const merged = mergeCollections({}, server);

    expect(merged).toEqual(server);
  });
});
