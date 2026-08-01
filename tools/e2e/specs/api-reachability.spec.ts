// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

// The API the bundle under test was built to call — VITE_API_BASE_URL at build
// time, FRONTEND_ORIGIN's counterpart at run time. Defaults to the local API so
// the same assertion holds against the development stack.
const apiBaseURL = process.env.SMOKE_API_BASE_URL ?? 'http://localhost:8080';

/**
 * The request is issued by the page, not by the runner, and that is the whole
 * point: it is the only check that exercises the CORS pairing between the web
 * origin and the API. `curl` against /health carries no `Origin` header, so it
 * answers the same whatever FRONTEND_ORIGIN the API was deployed with — the two
 * can be mismatched and every existing check still passes.
 */
test('the page origin can reach the API', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/');

  // A rejected cross-origin fetch surfaces as an opaque TypeError, which would
  // reach the report as an unhandled evaluate failure rather than as a result.
  const outcome = await page.evaluate(async (url) => {
    try {
      const response = await fetch(`${url}/health`);
      return String(response.status);
    } catch (error) {
      return `blocked: ${String(error)}`;
    }
  }, apiBaseURL);

  expect(outcome).toBe('200');
});
