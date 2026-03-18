// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { auth } from '@/lib/firebase';

export interface ProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
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
    throw new ApiError({
      type: 'about:blank',
      title: 'Unauthorized',
      status: 401,
      detail: 'Not signed in',
    });
  }

  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const problem: ProblemDetail = await response.json();
    throw new ApiError(problem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(path, { headers });
  return handleResponse<T>(response);
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(path, {
    method: 'PUT',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handleResponse<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetch(path, {
    method: 'DELETE',
    headers,
  });
  return handleResponse<void>(response);
}
