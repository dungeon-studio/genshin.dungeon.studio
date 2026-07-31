// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import {
  apiPath,
  closeWeaponSheet,
  collectWeapon,
  equippablePair,
  expect,
  test,
  weaponCardLabel,
  withApiWrite,
} from './fixtures';

const { weapon } = equippablePair();

// The level the refinement test drives to. The control it clicks and the state
// it then asserts both read from this, so moving it moves both together.
const REFINEMENT_LEVEL = 3;
const refinementLabel = `Set refinement level ${REFINEMENT_LEVEL}`;

test('the weapon collection is gated behind signing in', async ({ page }) => {
  await page.goto('/weapons');

  await page.getByRole('button', { name: weaponCardLabel(weapon, 0) }).click();

  await expect(page.getByText('Sign in to manage your weapon collection.')).toBeVisible();
  await expect(page.getByRole('dialog', { name: weapon.name })).toBeHidden();
});

test('an instance takes a refinement level that survives a reload', async ({
  signedInPage: page,
}) => {
  await collectWeapon(page, weapon);

  await withApiWrite(page, 'PATCH', apiPath.weapons, () =>
    page.getByRole('button', { name: refinementLabel }).click(),
  );

  await expect(page.getByRole('button', { name: refinementLabel })).toHaveAttribute(
    'aria-pressed',
    'true',
  );

  await page.reload();
  await page.getByRole('button', { name: weaponCardLabel(weapon, 1) }).click();

  await expect(page.getByRole('button', { name: refinementLabel })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});

test('a weapon can hold more than one instance', async ({ signedInPage: page }) => {
  await collectWeapon(page, weapon);

  await withApiWrite(page, 'POST', apiPath.weapons, () =>
    page.getByRole('button', { name: 'Add instance' }).click(),
  );

  await expect(page.getByRole('button', { name: /^Remove instance/ })).toHaveCount(2);

  await closeWeaponSheet(page, weapon);
  await expect(page.getByRole('button', { name: weaponCardLabel(weapon, 2) })).toBeVisible();
});
