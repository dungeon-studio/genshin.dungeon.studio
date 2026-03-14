// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { execFileSync } from 'node:child_process';

type HealthResponse = {
  status?: string;
  version?: string;
  sha?: string | null;
};

const baseUrlArg = process.argv[2];
if (!baseUrlArg) {
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

const healthUrl = new URL('/health', baseUrlArg);
const headers = new Headers();
if (healthBearerToken) {
  headers.set('Authorization', `Bearer ${healthBearerToken}`);
}

const getHealthWithRetry = async (): Promise<HealthResponse> => {
  let lastFailure: string | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(healthUrl, { headers });

      if (response.ok) {
        const healthResponseBody = (await response.json()) as HealthResponse;

        if (healthResponseBody.status !== 'ok') {
          lastFailure = `unexpected_status=${String(healthResponseBody.status)}`;
        } else if (healthResponseBody.sha !== expectedSha) {
          lastFailure = `sha_mismatch=deployed:${String(healthResponseBody.sha)} expected:${expectedSha}`;
        } else {
          return healthResponseBody;
        }
      } else {
        lastFailure = `http_status=${response.status}; status_text=${response.statusText}`;
      }
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
    }

    if (attempt === maxAttempts) {
      throw new Error(
        `Health check failed after ${maxAttempts} attempts; last_failure=${lastFailure ?? 'unknown'}`,
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, sleepSeconds * 1000);
    });
  }

  throw new Error('Health check retry loop exited unexpectedly');
};

await getHealthWithRetry();
