// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { expect, test } from '@playwright/test';

import { apiWrite, collectCharacter, collectWeapon, equippablePair, signIn } from './fixtures';

const { character, weapon } = equippablePair();

// The team editor draws its pools from the character and weapon collections, and
// a weapon instance only exists once the server has minted its id, so the whole
// flow is exercised signed in. Anonymous team building is not covered while the
// anonymous collection path is still open between #552 and #563.

test('a team takes a name, a character, and a weapon that survive a reload', async ({ page }) => {
  await page.goto('/');
  await signIn(page);

  await collectCharacter(page, character);
  await collectWeapon(page, weapon);

  await page.goto('/');

  const named = apiWrite(page, 'PUT', '/api/teams/1');
  await page.getByRole('button', { name: 'Edit name of Team 1' }).click();
  const nameField = page.getByRole('textbox', { name: 'Rename team 1' });
  await nameField.fill('Vaporise');
  await nameField.press('Enter');
  await named;

  const team = page.getByRole('region', { name: 'Vaporise' });
  await expect(team).toBeVisible();

  await team.getByRole('button').filter({ hasText: 'No character' }).first().click();

  const characterAssigned = apiWrite(page, 'PUT', '/api/teams/1');
  await page.getByRole('button', { name: `Add ${character.name} to team` }).click();
  await characterAssigned;

  await page.getByRole('button', { name: 'Weapons' }).click();

  const weaponAssigned = apiWrite(page, 'PUT', '/api/teams/1');
  await page.getByRole('button', { name: `Assign ${weapon.name} to character` }).click();
  await weaponAssigned;

  await page.keyboard.press('Escape');

  await expect(team.getByText(character.name)).toBeVisible();
  await expect(team.getByText(weapon.name)).toBeVisible();

  await page.reload();

  const reloaded = page.getByRole('region', { name: 'Vaporise' });
  await expect(reloaded.getByText(character.name)).toBeVisible();
  await expect(reloaded.getByText(weapon.name)).toBeVisible();
});
