// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it, vi } from 'vitest';

import { assertProfileResponse } from './use-profile';

// The module imports @/lib/api, which initialises Firebase from env vars that
// are absent in the test environment. The guard under test needs none of it.
vi.mock('@/lib/firebase', () => ({ auth: {} }));

const VALID = {
  uid: 'user-123',
  email: 'traveler@example.com',
  emailVerified: true,
  picture: 'https://example.com/avatar.png',
  name: 'Traveler',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('assertProfileResponse', () => {
  it('accepts a fully populated composite profile', () => {
    expect(() => assertProfileResponse(VALID)).not.toThrow();
  });

  it('accepts a null email and an absent picture', () => {
    expect(() =>
      assertProfileResponse({
        uid: VALID.uid,
        email: null,
        emailVerified: VALID.emailVerified,
        name: VALID.name,
        createdAt: VALID.createdAt,
        updatedAt: VALID.updatedAt,
      }),
    ).not.toThrow();
  });

  it('rejects a non-object', () => {
    expect(() => assertProfileResponse(null)).toThrow(TypeError);
    expect(() => assertProfileResponse('profile')).toThrow(TypeError);
  });

  it('rejects a missing mutable name', () => {
    expect(() =>
      assertProfileResponse({
        uid: VALID.uid,
        email: VALID.email,
        emailVerified: VALID.emailVerified,
        picture: VALID.picture,
        createdAt: VALID.createdAt,
        updatedAt: VALID.updatedAt,
      }),
    ).toThrow(TypeError);
  });

  it('rejects a non-boolean emailVerified', () => {
    expect(() => assertProfileResponse({ ...VALID, emailVerified: 'yes' })).toThrow(TypeError);
  });

  it('rejects a non-timestamp updatedAt', () => {
    expect(() => assertProfileResponse({ ...VALID, updatedAt: 'last week' })).toThrow(TypeError);
  });
});
