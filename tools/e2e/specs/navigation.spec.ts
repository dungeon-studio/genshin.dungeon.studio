// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from './page-failures';

// Selected by the post-deploy run; see playwright-deployed.config.ts.
const DEPLOYED = { tag: '@deployed' } as const;

const ROUTES = [
  { path: '/', heading: 'Teams' },
  { path: '/characters', heading: 'Characters' },
  { path: '/weapons', heading: 'Weapons' },
  { path: '/privacy', heading: 'Privacy Policy' },
  { path: '/terms', heading: 'Terms of Service' },
] as const;

for (const route of ROUTES) {
  test(`${route.path} renders`, DEPLOYED, async ({ page }) => {
    await page.goto(route.path);

    await expect(page.getByRole('heading', { level: 1, name: route.heading })).toBeAttached();
  });
}

test('an unknown route renders the not-found page', DEPLOYED, async ({ page }) => {
  await page.goto('/no-such-page');

  await expect(page.getByText('Page Not Found')).toBeVisible();
});

test('the main navigation moves between routes', DEPLOYED, async ({ page }) => {
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
