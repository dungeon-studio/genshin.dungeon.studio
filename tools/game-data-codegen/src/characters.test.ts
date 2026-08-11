// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { compareVersions } from '@genshin/game-data';
import { describe, expect, it } from 'vitest';

import { buildCharacters } from './characters.js';

type BuiltCharacter = ReturnType<typeof buildCharacters>[number];

function precedes(previous: BuiltCharacter, current: BuiltCharacter): boolean {
  return previous.rarity === current.rarity
    ? compareVersions(previous.version, current.version) >= 0
    : previous.rarity > current.rarity;
}

describe('buildCharacters', () => {
  const characters = buildCharacters();

  it('returns a nonempty roster', () => {
    expect(characters.length).toBeGreaterThan(0);
  });

  it('produces unique, nonempty ids', () => {
    const ids = characters.map((character) => character.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.length > 0)).toBe(true);
  });

  it('sorts by rarity descending, then version descending', () => {
    const outOfOrder = characters
      .slice(1)
      .filter((current, index) => !precedes(characters[index], current));

    expect(outOfOrder).toEqual([]);
  });

  it('omits the characters whose element is not fixed', () => {
    const shapeshifters = characters.filter((character) =>
      ['aether', 'lumine', 'manekin', 'manekina'].includes(character.id),
    );

    expect(shapeshifters).toEqual([]);
  });

  it('omits collaboration characters', () => {
    expect(characters.map((character) => character.id)).not.toContain('aloy');
  });

  it('gives every character a release date', () => {
    const undated = characters.filter(
      (character) => !/^\d{4}-\d{2}-\d{2}$/.test(character.releaseDate),
    );

    expect(undated).toEqual([]);
  });
});
