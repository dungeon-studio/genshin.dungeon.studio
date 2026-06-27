// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { verifyToken } from '@/lib/firebase/auth.js';

const FAKE_UID = 'test-user-123';
export const FAKE_TOKEN = { uid: FAKE_UID } as Awaited<ReturnType<typeof verifyToken>>;

export interface AuthedRequestOptions {
  /** Profile URL to include in the Content-Type header. */
  profile?: string;
}

export function authedRequest(
  method: string,
  path: string,
  body?: unknown,
  options?: AuthedRequestOptions,
): Request {
  const init: RequestInit = {
    method,
    headers: { Authorization: 'Bearer valid-token' },
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
    const contentType = options?.profile
      ? `application/json; profile="${options.profile}"`
      : 'application/json';
    init.headers = { ...init.headers, 'Content-Type': contentType };
  }

  return new Request(`http://localhost${path}`, init);
}
