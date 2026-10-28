// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { CHARACTER_ROSTER } from '@genshin/game-data';

import {
  addCharacterLabel,
  apiPath,
  collectCharacter,
  constellationLabel,
  equippablePair,
  expect,
  rejectApiWrite,
  removeCharacterLabel,
  signIn,
  signOut,
  test,
  withApiWrite,
} from './fixtures';

const { character } = equippablePair();

const otherCharacter = CHARACTER_ROSTER.find((candidate) => candidate.id !== character.id);
if (!otherCharacter) throw new Error('Game data has fewer than two characters.');

const STARTING_CONSTELLATION = 0;
const RAISED_CONSTELLATION = 4;

test('the character collection is gated behind signing in', async ({ page }) => {
  await page.goto('/characters');

  await page.getByRole('button', { name: addCharacterLabel(character) }).click();

  await expect(page.getByText('Sign in to manage your character collection.')).toBeVisible();
  await expect(page.getByRole('button', { name: addCharacterLabel(character) })).toBeVisible();
});

test('a collected character takes a constellation level', async ({ signedInPage: page }) => {
  await collectCharacter(page, character);

  await page
    .getByRole('button', { name: constellationLabel(character, STARTING_CONSTELLATION) })
    .click();
  await withApiWrite(page, 'PUT', apiPath.character(character), () =>
    page.getByRole('button', { name: `Set constellation level ${RAISED_CONSTELLATION}` }).click(),
  );

  await expect(
    page.getByRole('button', { name: constellationLabel(character, RAISED_CONSTELLATION) }),
  ).toBeVisible();
});

test('a signed-in collection round-trips through the API', async ({ signedInPage: page }) => {
  await collectCharacter(page, character);

  // Nothing survives a reload in the browser, so what comes back has been
  // served by the API.
  await page.reload();

  await expect(page.getByRole('button', { name: removeCharacterLabel(character) })).toBeVisible();
});

test('signing out keeps the collection from reaching the next account', async ({ page }) => {
  await page.goto('/characters');
  await signIn(page, 'first');
  await collectCharacter(page, character);

  await signOut(page, 'first');

  await expect(page.getByRole('button', { name: addCharacterLabel(character) })).toBeVisible();

  await signIn(page, 'second');

  // Asserting an absence passes even before the collection loads. This
  // account's own character coming back after the reload shows the load
  // finished.
  await withApiWrite(page, 'PUT', apiPath.character(otherCharacter), () =>
    page.getByRole('button', { name: addCharacterLabel(otherCharacter) }).click(),
  );

  await page.reload();

  await expect(
    page.getByRole('button', { name: removeCharacterLabel(otherCharacter) }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: addCharacterLabel(character) })).toBeVisible();
});

test('a rejected add rolls back and says so', async ({ signedInPage: page, pageFailures }) => {
  await page.goto('/characters');

  await rejectApiWrite(page, 'PUT', apiPath.character(character));

  await page.getByRole('button', { name: addCharacterLabel(character) }).click();

  await expect(
    page.getByText(
      `Couldn't add ${character.name}. ${character.name} is out of your collection again. Try again.`,
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: addCharacterLabel(character) })).toBeVisible();

  // Chromium logs the injected 503 as a console error.
  expect(pageFailures.splice(0)).toEqual([expect.stringContaining('status of 503')]);
});
