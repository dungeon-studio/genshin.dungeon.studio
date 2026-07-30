// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

import { apiWrite, closeWeaponSheet, collectWeapon, equippablePair, signIn } from './fixtures';

const { weapon } = equippablePair();

test('the weapon collection is gated behind signing in', async ({ page }) => {
  await page.goto('/weapons');

  await page.getByRole('button', { name: `${weapon.name}, 0 owned` }).click();

  await expect(page.getByText('Sign in to manage your weapon collection.')).toBeVisible();
  await expect(page.getByRole('dialog', { name: weapon.name })).toBeHidden();
});

test('an instance takes a refinement level that survives a reload', async ({ page }) => {
  await page.goto('/weapons');
  await signIn(page);

  await collectWeapon(page, weapon);

  const refined = apiWrite(page, 'PATCH', '/api/weapons/');
  await page.getByRole('button', { name: 'Set refinement level 3' }).click();
  await refined;

  await expect(page.getByRole('button', { name: 'Set refinement level 3' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await page.getByRole('button', { name: `${weapon.name}, 1 owned` }).click();

  await expect(page.getByRole('button', { name: 'Set refinement level 3' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a weapon can hold more than one instance', async ({ page }) => {
  await page.goto('/weapons');
  await signIn(page);

  await collectWeapon(page, weapon);

  const added = apiWrite(page, 'POST', '/api/weapons');
  await page.getByRole('button', { name: 'Add instance' }).click();
  await added;

  await expect(page.getByRole('button', { name: /^Remove instance/ })).toHaveCount(2);

  await closeWeaponSheet(page, weapon);
  await expect(page.getByRole('button', { name: `${weapon.name}, 2 owned` })).toBeVisible();
});
