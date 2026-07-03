// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import '@testing-library/jest-dom/vitest';

import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './msw/server';

// @/lib/firebase throws at import unless the Firebase env vars are present, and
// the API client reads auth.currentUser for bearer tokens. Stub it globally so
// any module in the transitive import graph resolves without real Firebase.
vi.mock('@/lib/firebase', () => ({
  auth: { currentUser: null },
}));

// Unhandled requests surface as errors so a missing handler fails loudly rather
// than hanging or hitting the network.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
