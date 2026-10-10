// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  deserialiseWeapon,
  serialiseWeapon,
  weaponItemDocument,
  weaponListDocument,
  weaponRepresentation,
  weaponsOfDocument,
} from './weapons.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';
import type { CollectionWeapon } from '../../weapon/collection-weapon.js';

const BASE_URL = 'http://localhost:8080';
const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const VALID_WEAPON: CollectionWeapon = {
  weaponInstanceId: 'wep-001',
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
    expect(item.href).toBe(`${BASE_URL}/weapons/wep-001`);
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

describe('deserialiseWeapon sanitisation', () => {
  it('strips unknown data entries off the deserialised weapon', () => {
    const item = serialiseWeapon(VALID_WEAPON, BASE_URL);
    const injected = { ...item, data: [...item.data, { name: 'injected', value: 'evil' }] };
    expect(deserialiseWeapon(injected)).toEqual(VALID_WEAPON);
  });
});

describe('weaponListDocument', () => {
  it('addresses the collection URL', () => {
    const document = weaponListDocument([VALID_WEAPON], BASE_URL);
    expect(document.collection.href).toBe(`${BASE_URL}/weapons`);
  });

  it('holds one item per weapon in order', () => {
    const other: CollectionWeapon = { ...VALID_WEAPON, weaponInstanceId: 'wep-002' };
    const document = weaponListDocument([VALID_WEAPON, other], BASE_URL);
    expect(document.collection.items.map((item) => item.href)).toEqual([
      `${BASE_URL}/weapons/wep-001`,
      `${BASE_URL}/weapons/wep-002`,
    ]);
  });

  it('carries the weapon template', () => {
    const document = weaponListDocument([], BASE_URL);
    expect(document.collection.template).toEqual(weaponRepresentation.template);
  });
});

describe('weaponsOfDocument', () => {
  it("addresses the weapon's filtered collection URL", () => {
    const document = weaponsOfDocument('mistsplitter-reforged', [VALID_WEAPON], BASE_URL);
    expect(document.collection.href).toBe(`${BASE_URL}/weapons?weaponId=mistsplitter-reforged`);
  });

  it('holds one item per weapon in order', () => {
    const other: CollectionWeapon = { ...VALID_WEAPON, weaponInstanceId: 'wep-002' };
    const document = weaponsOfDocument('mistsplitter-reforged', [VALID_WEAPON, other], BASE_URL);
    expect(document.collection.items.map((item) => item.href)).toEqual([
      `${BASE_URL}/weapons/wep-001`,
      `${BASE_URL}/weapons/wep-002`,
    ]);
  });

  it('carries the weapon template', () => {
    const document = weaponsOfDocument('mistsplitter-reforged', [], BASE_URL);
    expect(document.collection.template).toEqual(weaponRepresentation.template);
  });
});

describe('weaponItemDocument', () => {
  it("addresses the weapon's own URL", () => {
    const document = weaponItemDocument(VALID_WEAPON, BASE_URL);
    expect(document.collection.href).toBe(`${BASE_URL}/weapons/wep-001`);
  });

  it('holds only that weapon', () => {
    const document = weaponItemDocument(VALID_WEAPON, BASE_URL);
    expect(document.collection.items.map((item) => item.href)).toEqual([
      `${BASE_URL}/weapons/wep-001`,
    ]);
  });

  it('carries the weapon template', () => {
    const document = weaponItemDocument(VALID_WEAPON, BASE_URL);
    expect(document.collection.template).toEqual(weaponRepresentation.template);
  });
});
