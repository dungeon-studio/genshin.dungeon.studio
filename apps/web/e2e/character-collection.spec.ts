// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import {
  addCharacterLabel,
  collectCharacter,
  constellationLabel,
  equippablePair,
  expect,
  removeCharacterLabel,
  test,
} from './fixtures';

const { character } = equippablePair();

const STARTING_CONSTELLATION = 0;
const RAISED_CONSTELLATION = 4;

// Nothing here asserts that an anonymous collection outlives a navigation or a
// reload. It does not today — the store clears whenever the hook mounts without
// a user — and whether it should is open between #552 and #563, which propose
// opposite answers. Asserting either would put this suite on one side of it.

test('a character can be collected and released anonymously', async ({ page }) => {
  await page.goto('/characters');

  await page.getByRole('button', { name: addCharacterLabel(character) }).click();

  const owned = page.getByRole('button', { name: removeCharacterLabel(character) });
  await expect(owned).toBeVisible();

  await owned.click();

  await expect(page.getByRole('button', { name: addCharacterLabel(character) })).toBeVisible();
});

test('a collected character takes a constellation level', async ({ page }) => {
  await page.goto('/characters');

  await page.getByRole('button', { name: addCharacterLabel(character) }).click();
  await page
    .getByRole('button', { name: constellationLabel(character, STARTING_CONSTELLATION) })
    .click();
  await page
    .getByRole('button', { name: `Set constellation level ${RAISED_CONSTELLATION}` })
    .click();

  await expect(
    page.getByRole('button', { name: constellationLabel(character, RAISED_CONSTELLATION) }),
  ).toBeVisible();
});

test('a signed-in collection round-trips through the API', async ({ signedInPage: page }) => {
  await collectCharacter(page, character);

  // A reload clears the persisted collection while auth is still resolving, so
  // what comes back has been served by the API rather than read from
  // localStorage.
  await page.reload();

  await expect(page.getByRole('button', { name: removeCharacterLabel(character) })).toBeVisible();
});
