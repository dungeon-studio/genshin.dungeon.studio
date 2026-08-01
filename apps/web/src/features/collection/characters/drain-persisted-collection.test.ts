// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it } from 'vitest';

import { makeCharacter } from '@/test/fixtures';

import { drainPersistedCollection } from './drain-persisted-collection';

const KEY = 'genshin-collection';

beforeEach(() => {
  localStorage.clear();
});

describe('drainPersistedCollection', () => {
  it('returns the collection inside the zustand persist envelope', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ state: { characters: { amber: makeCharacter('amber', 2) } }, version: 1 }),
    );

    expect(drainPersistedCollection()['amber'].constellationLevel).toBe(2);
  });

  it('clears the key so a later sign-in cannot resurrect drained data', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ state: { characters: { amber: makeCharacter('amber', 2) } }, version: 1 }),
    );

    drainPersistedCollection();

    expect(localStorage.getItem(KEY)).toBeNull();
    expect(drainPersistedCollection()).toEqual({});
  });

  it('clears the key even when the blob cannot be read', () => {
    localStorage.setItem(KEY, 'not json');

    expect(drainPersistedCollection()).toEqual({});
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('is empty when no anonymous collection was ever stored', () => {
    expect(drainPersistedCollection()).toEqual({});
  });
});
