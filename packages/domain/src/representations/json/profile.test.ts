// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import type { AuthIdentity } from '../../authIdentity.js';
import type { ISOTimestamp } from '../../isoTimestamp.js';
import type { UserProfile } from '../../userProfile.js';
import { deserialiseProfile, serialiseProfile } from './profile.js';

const VALID_TIMESTAMP = '2024-01-15T12:00:00Z' as ISOTimestamp;

const AUTH: AuthIdentity = {
  uid: 'user-123',
  email: 'test@example.com',
  emailVerified: true,
  picture: 'https://example.com/photo.jpg',
};

const PROFILE: UserProfile = {
  name: 'Traveler',
  createdAt: VALID_TIMESTAMP,
  updatedAt: VALID_TIMESTAMP,
};

describe('profile serialisation round-trip', () => {
  it('deserialises a serialised profile back to the original parts', () => {
    const wire = serialiseProfile(AUTH, PROFILE);
    const { auth, profile } = deserialiseProfile(wire);
    expect(auth).toEqual(AUTH);
    expect(profile).toEqual(PROFILE);
  });

  it('serialises auth fields into the wire format', () => {
    const wire = serialiseProfile(AUTH, PROFILE);
    expect(wire.uid).toBe('user-123');
    expect(wire.email).toBe('test@example.com');
    expect(wire.emailVerified).toBe(true);
    expect(wire.picture).toBe('https://example.com/photo.jpg');
  });

  it('serialises profile fields into the wire format', () => {
    const wire = serialiseProfile(AUTH, PROFILE);
    expect(wire.name).toBe('Traveler');
    expect(wire.createdAt).toBe(VALID_TIMESTAMP);
    expect(wire.updatedAt).toBe(VALID_TIMESTAMP);
  });

  it('handles missing optional auth fields', () => {
    const minimalAuth: AuthIdentity = { uid: 'user-456' };
    const wire = serialiseProfile(minimalAuth, PROFILE);
    expect(wire.email).toBeNull();
    expect(wire.emailVerified).toBe(false);
    expect(wire.picture).toBeNull();

    const { auth } = deserialiseProfile(wire);
    expect(auth.email).toBeUndefined();
    expect(auth.picture).toBeUndefined();
  });
});
