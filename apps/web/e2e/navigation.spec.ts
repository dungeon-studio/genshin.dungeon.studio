// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { ConsoleMessage, Page } from '@playwright/test';

import { expect, test } from './fixtures';

const ROUTES = [
  { path: '/', heading: 'Teams' },
  { path: '/characters', heading: 'Characters' },
  { path: '/weapons', heading: 'Weapons' },
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Service' },
] as const;

/**
 * Collect the failures a route produces without changing what it renders.
 *
 * Without them, a "the heading is there" assertion passes on a page whose data
 * layer threw.
 */
function watchForFailures(page: Page): string[] {
  const failures: string[] = [];

  page.on('pageerror', (error) => failures.push(`uncaught: ${error.message}`));
  page.on('console', (message: ConsoleMessage) => {
    if (message.type() === 'error') failures.push(`console.error: ${message.text()}`);
  });

  return failures;
}

for (const route of ROUTES) {
  test(`${route.path} renders`, async ({ page }) => {
    const failures = watchForFailures(page);

    await page.goto(route.path);

    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeAttached();
    expect(failures).toEqual([]);
  });
}

test('an unknown route renders the not-found page', async ({ page }) => {
  const failures = watchForFailures(page);

  await page.goto('/no-such-page');

  await expect(page.getByText('Page Not Found')).toBeVisible();
  expect(failures).toEqual([]);
});

test('the main navigation moves between routes', async ({ page }) => {
  await page.goto('/');

  const nav = page.getByRole('navigation', { name: 'Main navigation' });

  await nav.getByRole('link', { name: 'Characters' }).click();
  await page.waitForURL('**/characters');
  await expect(page.getByRole('heading', { level: 1, name: 'Characters' })).toBeAttached();

  await nav.getByRole('link', { name: 'Weapons' }).click();
  await page.waitForURL('**/weapons');
  await expect(page.getByRole('heading', { level: 1, name: 'Weapons' })).toBeAttached();

  await nav.getByRole('link', { name: 'Teams' }).click();
  await page.waitForURL((url) => url.pathname === '/');
  await expect(page.getByRole('heading', { level: 1, name: 'Teams' })).toBeAttached();
});
