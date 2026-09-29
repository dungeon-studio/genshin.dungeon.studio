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

test('an anonymous collection merges into the account on first sign-in', async ({ page }) => {
  await page.goto('/characters');

  await page.getByRole('button', { name: addCharacterLabel(character) }).click();

  // Signing in from the same page keeps the anonymous store alive; a navigation
  // would clear it before the account arrives.
  await withApiWrite(page, 'PUT', apiPath.character(character), () => signIn(page));

  await expect(page.getByText('Merged 1 character(s) from your local collection.')).toBeVisible();

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

test('a rejected add rolls back and says so', async ({ signedInPage: page }) => {
  await page.goto('/characters');

  await rejectApiWrite(page, 'PUT', apiPath.character(character));

  await page.getByRole('button', { name: addCharacterLabel(character) }).click();

  await expect(page.getByText('Failed to add character. Change has been reverted.')).toBeVisible();
  await expect(page.getByRole('button', { name: addCharacterLabel(character) })).toBeVisible();
});
