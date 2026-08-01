// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

import { LOCAL_API_ORIGIN } from './origins';

// The API the bundle under test was built to call — VITE_API_BASE_URL at build
// time, FRONTEND_ORIGIN's counterpart at run time.
const apiOrigin = process.env.SMOKE_API_BASE_URL ?? LOCAL_API_ORIGIN;

/** What the page got back, or why it never got that far. */
type Reachability = { status: number } | { blocked: string };

/**
 * The request is issued by the page, not by the runner, and that is the whole
 * point: it is the only check that exercises the CORS pairing between the web
 * origin and the API. `curl` against /health carries no `Origin` header, so it
 * answers the same whatever FRONTEND_ORIGIN the API was deployed with — the two
 * can be mismatched and every existing check still passes.
 */
test('the page origin can reach the API', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');

  // A refused cross-origin request rejects with an opaque TypeError. Returning
  // it as a result rather than letting it escape keeps the reason in the report
  // instead of an unhandled evaluate failure.
  const reachability = await page.evaluate(async (origin): Promise<Reachability> => {
    try {
      const response = await fetch(`${origin}/health`);
      return { status: response.status };
    } catch (error) {
      return { blocked: String(error) };
    }
  }, apiOrigin);

  expect(reachability).toEqual({ status: 200 });
});
