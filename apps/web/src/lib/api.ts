// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { auth } from '@/lib/firebase';
import type { ProblemDetail } from '@genshin/domain';

export type { ProblemDetail };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('Missing required environment variable: VITE_API_BASE_URL');
}

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
      const problem: ProblemDetail = await response.json();
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

export async function apiDelete(path: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(new URL(path, API_BASE_URL).href, {
    method: 'DELETE',
    headers,
  });
  await handleResponse(response);
}
