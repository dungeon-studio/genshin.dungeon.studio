// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type * as LoggerModule from '@/logger.js';

// Shaped like a Firebase ID token — three base64url segments — because that is
// what the scrubbing in `@/logger.js` matches on.
const CREDENTIAL = 'eyJhbGciOiJSUzI1NiIsImtpZCI6InNlbnRpbmVsIn0.eyJ1aWQiOiJzZW50aW5lbCJ9.c2ln';

const lines: string[] = [];

// The app reaches for the process-wide logger at import, so the destination has
// to be in place before it is pulled in.
vi.mock('@/logger.js', async (importOriginal) => {
  const actual = await importOriginal<typeof LoggerModule>();
  return {
    ...actual,
    logger: actual.createLogger({
      level: 'info',
      destination: { write: (line: string) => lines.push(line) },
    }),
  };
});

vi.mock('@/firebase/auth.js', () => ({ verifyToken: vi.fn() }));

const { verifyToken } = await import('@/firebase/auth.js');
const { app } = await import('@/app.js');

beforeEach(() => {
  lines.length = 0;
  vi.mocked(verifyToken).mockReset();
});

describe('a request carrying a bearer credential', () => {
  it('logs nothing containing it when verification fails unexpectedly', async () => {
    vi.mocked(verifyToken).mockRejectedValue(
      new Error(`upstream rejected ${CREDENTIAL} after one attempt`),
    );

    const res = await app.request('/characters', {
      headers: { Authorization: `Bearer ${CREDENTIAL}` },
    });

    expect(res.status).toBe(500);
    expect(lines.join('')).not.toContain(CREDENTIAL);
  });
});
