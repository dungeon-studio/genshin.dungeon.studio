/* SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com> */
/* SPDX-License-Identifier: MIT */

import { describe, expect, it } from 'vitest';

import { isUUID } from './uuid.js';

describe('isUUID', () => {
  it('accepts a canonical UUID', () => {
    expect(isUUID('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
  });

  it('accepts uppercase hex', () => {
    expect(isUUID('3F2504E0-4F89-41D3-9A0C-0305E82C3301')).toBe(true);
  });

  it.each([
    ['an arbitrary label', 'instance-uuid-1'],
    ['Firestore path traversal', '../../users/someone-else/weapons/stolen'],
    ['a bare slash', 'a/b'],
    ['the empty string', ''],
    ['a truncated UUID', '3f2504e0-4f89-41d3-9a0c'],
    ['trailing content', '3f2504e0-4f89-41d3-9a0c-0305e82c3301-extra'],
    ['non-hex characters', '3f2504e0-4f89-41d3-9a0c-0305e82c330z'],
  ])('rejects %s', (_label, value) => {
    expect(isUUID(value)).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isUUID(undefined)).toBe(false);
  });
});
