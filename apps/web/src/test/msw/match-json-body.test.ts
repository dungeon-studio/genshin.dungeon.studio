// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { describe, expect, it } from 'vitest';

import { matchJsonBody } from './match-json-body';

const TEAM_URL = 'http://localhost:8080/teams/1';
const matchesHeld = matchJsonBody<{ held: boolean }>(TEAM_URL, ({ held }) => held);

const put = (url: string) =>
  matchesHeld({
    request: new Request(url, { method: 'PUT', body: JSON.stringify({ held: true }) }),
    cookies: {},
  });

describe('matchJsonBody', () => {
  it('matches a request to its TEAM_URL whose body satisfies the predicate', async () => {
    await expect(put(TEAM_URL)).resolves.toBe(true);
  });

  it('ignores a request to another TEAM_URL with the same body', async () => {
    await expect(put('http://localhost:8080/teams/2')).resolves.toBe(false);
  });
});
