// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { toGameVersion } from './version.js';

describe('toGameVersion', () => {
  it('reads a multi-digit minor as a number', () => {
    expect(toGameVersion('5.10', 'Mavuika')).toEqual({ major: 5, minor: 10 });
  });

  it.each(['Luna I', '6', '6.0.1', ''])('names the record behind "%s"', (value) => {
    expect(() => toGameVersion(value, 'Mavuika')).toThrow('Mavuika');
  });
});
