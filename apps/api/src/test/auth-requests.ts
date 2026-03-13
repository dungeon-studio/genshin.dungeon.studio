// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { verifyToken } from '@/lib/firebase/auth.js';

export const FAKE_UID = 'test-user-123';
export const FAKE_TOKEN = { uid: FAKE_UID } as Awaited<ReturnType<typeof verifyToken>>;

export function authedRequest(method: string, path: string, body?: unknown) {
  const init: RequestInit = {
    method,
    headers: { Authorization: 'Bearer valid-token' },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    init.headers = { ...init.headers, 'Content-Type': 'application/json' };
  }

  return new Request(`http://localhost${path}`, init);
}
