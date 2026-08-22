// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { CharacterId } from '@genshin/domain';
import { beforeEach, describe, expect, it } from 'vitest';

import { makeCharacter } from '@/test/fixtures';

import { mergeCollections, useCollectionStore } from './use-character-collection-store';

/** A real character the tests never add, for the "not in the collection" paths. */
const UNOWNED: CharacterId = 'zhongli';

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

    it('is a no-op for characters not in the collection', () => {
      useCollectionStore.getState().removeCharacter(UNOWNED);

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

    it('ignores updates for characters not in the collection', () => {
      useCollectionStore.getState().setConstellationLevel(UNOWNED, 3);

      expect(useCollectionStore.getState().characters[UNOWNED]).toBeUndefined();
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
    const local = { amber: makeCharacter('amber', { constellationLevel: 3 }) };
    const server = { amber: makeCharacter('amber', { constellationLevel: 1 }) };

    const merged = mergeCollections(local, server);

    expect(merged).toMatchObject({ amber: { constellationLevel: 3 } });
  });

  it('keeps server value when server constellation is higher', () => {
    const local = { amber: makeCharacter('amber', { constellationLevel: 1 }) };
    const server = { amber: makeCharacter('amber', { constellationLevel: 5 }) };

    const merged = mergeCollections(local, server);

    expect(merged).toMatchObject({ amber: { constellationLevel: 5 } });
  });

  it('returns server collection when local is empty', () => {
    const server = { amber: makeCharacter('amber', { constellationLevel: 2 }) };

    const merged = mergeCollections({}, server);

    expect(merged).toEqual(server);
  });
});
