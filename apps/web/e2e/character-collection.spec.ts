// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

import { collectCharacter, equippablePair, signIn } from './fixtures';

const { character } = equippablePair();

// Nothing here asserts that an anonymous collection outlives a navigation or a
// reload. It does not today — the store is cleared whenever the hook mounts
// without a user — and whether it should is still open between #552 (keep
// zustand + localStorage as the anonymous path) and #563 (drop anonymous
// persistence and gate characters on auth, as weapons already are). Pinning
// either answer here would put this suite on one side of that decision.

test('a character can be collected and released anonymously', async ({ page }) => {
  await page.goto('/characters');

  await page.getByRole('button', { name: `Add ${character.name} to collection` }).click();

  const owned = page.getByRole('button', { name: `Remove ${character.name} from collection` });
  await expect(owned).toBeVisible();

  await owned.click();

  await expect(
    page.getByRole('button', { name: `Add ${character.name} to collection` }),
  ).toBeVisible();
});

test('a collected character takes a constellation level', async ({ page }) => {
  await page.goto('/characters');

  await page.getByRole('button', { name: `Add ${character.name} to collection` }).click();
  await page
    .getByRole('button', { name: `Constellation level 0 for ${character.name}, click to edit` })
    .click();
  await page.getByRole('button', { name: 'Set constellation level 4' }).click();

  await expect(
    page.getByRole('button', {
      name: `Constellation level 4 for ${character.name}, click to edit`,
    }),
  ).toBeVisible();
});

test('a signed-in collection round-trips through the API', async ({ page }) => {
  await page.goto('/characters');
  await signIn(page);

  await collectCharacter(page, character);

  // A reload drops every in-memory store, so what comes back has been served by
  // the API out of Firestore.
  await page.reload();

  await expect(
    page.getByRole('button', { name: `Remove ${character.name} from collection` }),
  ).toBeVisible();
});
