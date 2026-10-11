// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { fakeUser } from '@/test/render';

import type { AuthState } from './auth-context';
import { awaitingUserData } from './auth-state';

const SIGNED_IN: AuthState = { status: 'signed-in', user: fakeUser('user-1') };

describe('awaitingUserData', () => {
  it.each([true, false])('waits while auth settles (query loading: %o)', (query) => {
    expect(awaitingUserData({ status: 'loading' }, query)).toBe(true);
  });

  it.each([true, false])('never waits once signed out (query loading: %o)', (query) => {
    expect(awaitingUserData({ status: 'signed-out' }, query)).toBe(false);
  });

  it('follows the query once signed in', () => {
    expect(awaitingUserData(SIGNED_IN, true)).toBe(true);
    expect(awaitingUserData(SIGNED_IN, false)).toBe(false);
  });
});
