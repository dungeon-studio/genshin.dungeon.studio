// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Weapon } from '@genshin/game-data';
import { CHARACTERS, WEAPONS } from '@genshin/game-data';
import type { Page, Response } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * A character and a weapon the character can actually equip.
 *
 * The team editor derives its weapon pool from the selected member's weapon
 * type, so a mismatched pair would leave that pool empty. Picking the pair out
 * of the game data rather than naming a character keeps the suite alive across
 * roster changes.
 */
export function equippablePair(): { character: Character; weapon: Weapon } {
  for (const character of CHARACTERS) {
    const weapon = WEAPONS.find((candidate) => candidate.type === character.weaponType);
    if (weapon) return { character, weapon };
  }

  throw new Error('Game data has no character with a weapon of a matching type.');
}

/**
 * A promise for the API write a signed-in mutation triggers.
 *
 * Every collection mutation writes to the local store first and calls the API
 * behind it, so the UI reaches its asserted state before the server has the
 * change. Anything that later reloads the page has to await the write itself
 * or it races the request it depends on.
 */
export function apiWrite(page: Page, method: string, pathFragment: string): Promise<Response> {
  return page.waitForResponse(
    (response) =>
      response.request().method() === method &&
      response.url().includes(pathFragment) &&
      response.ok(),
  );
}

let accountSequence = 0;

/**
 * Sign in through the Firebase Auth emulator's Google provider screen.
 *
 * Each call registers a new emulator account, so signed-in specs never share
 * Firestore documents. The emulator's screen is the one the Firebase CLI
 * serves at /emulator/auth/handler; its controls are addressed by id because
 * they carry no accessible names.
 */
export async function signIn(page: Page): Promise<void> {
  accountSequence += 1;

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const popup = await popupPromise;

  // The emulator's screen wires its controls up in a script that runs after
  // load, so a click that only waited for the element to exist silently does
  // nothing and leaves the account form hidden.
  await popup.waitForLoadState('load');
  await popup.getByRole('button', { name: 'Add new account' }).click();

  const email = popup.locator('#email-input');
  await expect(email).toBeVisible();
  await email.fill(`e2e.${accountSequence}.${process.pid}@example.com`);
  await popup.locator('#display-name-input').fill(`E2E Traveler ${accountSequence}`);
  await popup.locator('#sign-in').click();

  // The header switching over is the signal that the credential reached the
  // app; waiting on the popup closing races the message it still has to send.
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
}

/** Put a character in the signed-in collection via the UI, server write included. */
export async function collectCharacter(page: Page, character: Character): Promise<void> {
  await page.goto('/characters');

  const written = apiWrite(page, 'PUT', `/api/characters/${encodeURIComponent(character.id)}`);
  await page.getByRole('button', { name: `Add ${character.name} to collection` }).click();
  await written;

  await expect(
    page.getByRole('button', { name: `Remove ${character.name} from collection` }),
  ).toBeVisible();
}

/**
 * Put one instance of a weapon in the signed-in collection via the UI.
 *
 * Opening a weapon the collection does not hold yet auto-creates its first
 * instance, so selecting the card is the whole interaction.
 */
export async function collectWeapon(page: Page, weapon: Weapon): Promise<void> {
  await page.goto('/weapons');

  const written = apiWrite(page, 'POST', '/api/weapons');
  await page.getByRole('button', { name: `${weapon.name}, 0 owned` }).click();
  await written;

  // Selecting the card opens the instance sheet, and that sheet is modal: it
  // hides the grid behind it from the accessibility tree, so the card's own
  // "1 owned" label is unreachable until the sheet closes. Assert on the
  // instance the sheet now lists instead.
  await expect(page.getByRole('dialog', { name: weapon.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove instance 1' })).toBeVisible();
}

/** Dismiss the weapon instance sheet and wait for the grid to come back. */
export async function closeWeaponSheet(page: Page, weapon: Weapon): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: weapon.name })).toBeHidden();
}
