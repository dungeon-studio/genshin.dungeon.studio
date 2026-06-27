// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import {
  CURRENT_VERSION,
  deserialiseProfile,
  serialiseProfile,
  type V0ProfileResponse,
  type V1ProfileResponse,
} from './profile.js';
import type { AuthIdentity } from '../../auth-identity.js';
import type { ISOTimestamp } from '../../iso-timestamp.js';
import type { UserProfile } from '../../user-profile.js';

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

describe('schemaVersion migration', () => {
  it('stamps the current schema version on serialisation', () => {
    const wire = serialiseProfile(AUTH, PROFILE);
    expect(wire.schemaVersion).toBe(CURRENT_VERSION);
  });

  it('migrates a V0 payload (no schemaVersion) on deserialisation', () => {
    const v0 = {
      uid: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
      picture: 'https://example.com/photo.jpg',
      name: 'Traveler',
      createdAt: VALID_TIMESTAMP,
      updatedAt: VALID_TIMESTAMP,
    } satisfies V0ProfileResponse;

    const { auth, profile } = deserialiseProfile(v0);
    expect(auth).toEqual(AUTH);
    expect(profile).toEqual(PROFILE);
  });

  it('deserialises a V1 payload', () => {
    const v1 = {
      schemaVersion: 1,
      uid: 'user-123',
      email: 'test@example.com',
      emailVerified: true,
      picture: 'https://example.com/photo.jpg',
      name: 'Traveler',
      createdAt: VALID_TIMESTAMP,
      updatedAt: VALID_TIMESTAMP,
    } satisfies V1ProfileResponse;

    const { auth, profile } = deserialiseProfile(v1);
    expect(auth).toEqual(AUTH);
    expect(profile).toEqual(PROFILE);
  });

  it('throws on a structurally invalid payload', () => {
    expect(() => deserialiseProfile({ uid: 'user-123' } as unknown as V0ProfileResponse)).toThrow(
      TypeError,
    );
  });
});
