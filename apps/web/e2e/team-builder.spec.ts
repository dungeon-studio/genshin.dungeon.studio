// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import {
  apiPath,
  collectCharacter,
  collectWeapon,
  equippablePair,
  expect,
  test,
  withApiWrite,
} from './fixtures';

const { character, weapon } = equippablePair();

const TEAM_SLOT = 1;
const TEAM_NAME = 'Vaporise';

// The team editor draws its pools from the character and weapon collections, and
// a weapon instance only exists once the server has minted its id, so the whole
// flow is exercised signed in. Anonymous team building is not covered while the
// anonymous collection path is still open between #552 and #563.

test('a team takes a name, a character, and a weapon that survive a reload', async ({
  signedInPage: page,
}) => {
  await collectCharacter(page, character);
  await collectWeapon(page, weapon);

  await page.goto('/');

  await withApiWrite(page, 'PUT', apiPath.team(TEAM_SLOT), async () => {
    await page.getByRole('button', { name: `Edit name of Team ${TEAM_SLOT}` }).click();
    const nameField = page.getByRole('textbox', { name: `Rename team ${TEAM_SLOT}` });
    await nameField.fill(TEAM_NAME);
    await nameField.press('Enter');
  });

  const team = page.getByRole('region', { name: TEAM_NAME });
  await expect(team).toBeVisible();

  await team.getByRole('button').filter({ hasText: 'No character' }).first().click();

  await withApiWrite(page, 'PUT', apiPath.team(TEAM_SLOT), () =>
    page.getByRole('button', { name: `Add ${character.name} to team` }).click(),
  );

  await page.getByRole('button', { name: 'Weapons' }).click();

  await withApiWrite(page, 'PUT', apiPath.team(TEAM_SLOT), () =>
    page.getByRole('button', { name: `Assign ${weapon.name} to character` }).click(),
  );

  await page.keyboard.press('Escape');

  await expect(team.getByText(character.name)).toBeVisible();
  await expect(team.getByText(weapon.name)).toBeVisible();

  await page.reload();

  const reloaded = page.getByRole('region', { name: TEAM_NAME });
  await expect(reloaded.getByText(character.name)).toBeVisible();
  await expect(reloaded.getByText(weapon.name)).toBeVisible();
});
