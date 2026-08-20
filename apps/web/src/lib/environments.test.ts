// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { ENVIRONMENTS, resolveEnvironment } from './environments';

describe('resolveEnvironment', () => {
  it.each(['', undefined, 'production', 'PROD'])(
    'falls back to an announced environment for %o',
    (value) => {
      expect(resolveEnvironment(value).badge).not.toBeNull();
    },
  );

  it('leaves production unbadged', () => {
    expect(resolveEnvironment('prod').badge).toBeNull();
  });

  it('gives each announced environment a distinct label and icon variant', () => {
    const badges = [ENVIRONMENTS.dev.badge, ENVIRONMENTS.staging.badge];

    expect(new Set(badges.map((badge) => badge?.label)).size).toBe(badges.length);
    expect(new Set(badges.map((badge) => badge?.iconSuffix)).size).toBe(badges.length);
  });
});
