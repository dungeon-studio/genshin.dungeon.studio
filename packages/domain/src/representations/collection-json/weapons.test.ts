// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import type { CollectionWeapon } from '../../collection-weapon.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';
import type { UUID } from '../../uuid.js';
import { deserialiseWeapon, serialiseWeapon } from './weapons.js';

const BASE_URL = 'http://localhost:8080';
const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_WEAPON: CollectionWeapon = {
  weaponInstanceId: 'wep-001' as UUID,
  weaponId: 'mistsplitter-reforged',
  refinementLevel: 3,
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

describe('weapon serialisation round-trip', () => {
  it('deserialises a serialised weapon back to the original', () => {
    const item = serialiseWeapon(VALID_WEAPON, BASE_URL);
    const result = deserialiseWeapon(item);
    expect(result).toEqual(VALID_WEAPON);
  });

  it('serialises with the correct href', () => {
    const item = serialiseWeapon(VALID_WEAPON, BASE_URL);
    expect(item.href).toBe(`${BASE_URL}/api/weapons/wep-001`);
  });

  it('includes a collection link for the weapon type', () => {
    const item = serialiseWeapon(VALID_WEAPON, BASE_URL);
    expect(item.links).toBeDefined();
    const links = item.links;
    if (links === undefined) {
      throw new Error('expected item to have links');
    }
    expect(links[0].rel).toBe('collection');
  });

  it('preserves refinement level through round-trip', () => {
    const weapon: CollectionWeapon = { ...VALID_WEAPON, refinementLevel: 5 };
    const item = serialiseWeapon(weapon, BASE_URL);
    const result = deserialiseWeapon(item);
    expect(result.refinementLevel).toBe(5);
  });
});
