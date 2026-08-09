// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ProblemDetail } from '@genshin/domain';

import { auth } from '@/lib/firebase';

export type { ProblemDetail };

// `pnpm dev` needs no .env file; vite.config.ts fails deployed builds on a
// missing variable.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export class ApiError extends Error {
  readonly problem: ProblemDetail;

  constructor(problem: ProblemDetail) {
    super(problem.detail);
    this.name = 'ApiError';
    this.problem = problem;
  }
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = auth.currentUser;
  if (!user) {
    return {};
  }

  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse(response: Response): Promise<unknown> {
  if (!response.ok) {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/problem+json')) {
      // Trusted on the content type alone. Success bodies stay `unknown` for
      // callers to validate; error bodies are not validated at all.
      const problem = (await response.json()) as ProblemDetail;
      throw new ApiError(problem);
    }

    const text = await response.text();
    throw new ApiError({
      type: 'about:blank',
      title: response.statusText || 'Unknown Error',
      status: response.status,
      detail: text || `Request failed with status ${response.status}`,
    });
  }

  if (response.status === 204) {
    return undefined;
  }

  return response.json();
}

export async function apiGet(path: string): Promise<unknown> {
  const headers = await getAuthHeaders();
  const response = await fetch(new URL(path, API_BASE_URL).href, { headers });
  return handleResponse(response);
}

export async function apiPut(path: string, body: unknown): Promise<unknown> {
  const headers = await getAuthHeaders();
  const response = await fetch(new URL(path, API_BASE_URL).href, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiPost(path: string, body: unknown): Promise<unknown> {
  const headers = await getAuthHeaders();
  const response = await fetch(new URL(path, API_BASE_URL).href, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiPatch(path: string, body: unknown): Promise<unknown> {
  const headers = await getAuthHeaders();
  const response = await fetch(new URL(path, API_BASE_URL).href, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}

export async function apiDelete(path: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(new URL(path, API_BASE_URL).href, {
    method: 'DELETE',
    headers,
  });
  await handleResponse(response);
}
