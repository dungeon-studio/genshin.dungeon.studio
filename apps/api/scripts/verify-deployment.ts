// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { execFileSync } from 'node:child_process';

type HealthResponse = {
  status?: string;
  sha?: string | null;
};

const baseUrl = process.argv[2];
if (!baseUrl) {
  throw new Error('Base URL is required as first argument');
}

const expectedSha =
  process.env.GITHUB_SHA ?? execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

const healthBearerToken = process.env.HEALTH_BEARER_TOKEN;
const maxAttempts = Number.parseInt(process.env.MAX_ATTEMPTS ?? '10', 10);
const sleepSeconds = Number.parseInt(process.env.SLEEP_SECONDS ?? '3', 10);

if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
  throw new Error(`MAX_ATTEMPTS must be a positive integer, received: ${maxAttempts}`);
}

if (!Number.isInteger(sleepSeconds) || sleepSeconds < 0) {
  throw new Error(`SLEEP_SECONDS must be a non-negative integer, received: ${sleepSeconds}`);
}

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

let lastFailure: string | undefined;
let healthResponseBody: HealthResponse | undefined;

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const headers = new Headers();
  if (healthBearerToken) {
    headers.set('Authorization', `Bearer ${healthBearerToken}`);
  }

  try {
    const response = await fetch(new URL('/health', baseUrl), { headers });

    if (!response.ok) {
      lastFailure = `http_status=${response.status}; status_text=${response.statusText}`;
    } else {
      healthResponseBody = (await response.json()) as HealthResponse;
      break;
    }
  } catch (error) {
    lastFailure = error instanceof Error ? error.message : String(error);
  }

  if (attempt === maxAttempts) {
    throw new Error(
      `Health check failed after ${maxAttempts} attempts; last_failure=${lastFailure ?? 'unknown'}`,
    );
  }

  await sleep(sleepSeconds * 1000);
}

if (!healthResponseBody) {
  throw new Error('Health check response body is missing after successful request');
}

if (healthResponseBody.status !== 'ok') {
  throw new Error(`Unexpected health status: ${String(healthResponseBody.status)}`);
}

if (healthResponseBody.sha !== expectedSha) {
  throw new Error(
    `SHA mismatch: deployed=${String(healthResponseBody.sha)} expected=${expectedSha}`,
  );
}
