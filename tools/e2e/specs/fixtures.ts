// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Weapon } from '@genshin/game-data';
import { CHARACTER_ROSTER, WEAPON_ROSTER } from '@genshin/game-data';
import type { Page, Request } from '@playwright/test';

import { test as base, expect } from './page-failures';

/**
 * A character and a weapon the character can actually equip.
 *
 * The team editor derives its weapon pool from the selected member's weapon
 * type, so a mismatched pair leaves that pool empty. Derived from game data, so
 * a roster change cannot strand the suite on a character that no longer exists.
 */
export function equippablePair(): { character: Character; weapon: Weapon } {
  for (const character of CHARACTER_ROSTER) {
    const weapon = WEAPON_ROSTER.find((candidate) => candidate.type === character.weaponType);
    if (weapon) return { character, weapon };
  }

  throw new Error('Game data has no character with a weapon of a matching type.');
}

// The accessible names the app renders.

export function weaponCardLabel(weapon: Weapon, instances: number): string {
  return `${weapon.name}, ${instances} owned`;
}

export function addCharacterLabel(character: Character): string {
  return `Add ${character.name} to collection`;
}

export function removeCharacterLabel(character: Character): string {
  return `Remove ${character.name} from collection`;
}

export function constellationLabel(character: Character, level: number): string {
  return `Constellation level ${level} for ${character.name}, click to edit`;
}

/**
 * The API paths the collection mutations hit, matched as substrings of the
 * request URL.
 *
 * A weapon item path extends the collection path, so the path alone never
 * separates the two: the HTTP method alongside it does.
 */
export const apiPath = {
  character: (character: Character) => `/characters/${encodeURIComponent(character.id)}`,
  weapons: '/weapons',
  team: (slot: number) => `/teams/${slot}`,
} as const;

/**
 * Run an action and wait for the API write it triggers.
 *
 * Every collection mutation writes to the local store first and calls the API
 * behind it, so the UI reaches its asserted state before the server has the
 * change. Anything that later reloads the page has to await that write, and the
 * listener has to be watching before the request goes out.
 */
export async function withApiWrite(
  page: Page,
  method: string,
  pathFragment: string,
  action: () => Promise<void>,
): Promise<void> {
  const settled = Promise.race([
    page.waitForResponse(
      (response) => isApiWrite(response.request(), method, pathFragment) && response.ok(),
    ),
    blockedApiWrite(page, method, pathFragment),
  ]);

  // A blocked request can fail before the action resolves.
  await Promise.all([settled, action()]);
}

/**
 * Fail, naming the request, when the browser blocks a matching API write.
 *
 * A blocked write, such as one refused by CORS, never gets a response to wait on.
 */
async function blockedApiWrite(page: Page, method: string, pathFragment: string): Promise<never> {
  const request = await page.waitForEvent('requestfailed', (candidate) =>
    isApiWrite(candidate, method, pathFragment),
  );

  throw new Error(
    `${request.method()} ${request.url()} failed: ${request.failure()?.errorText ?? 'unknown error'}`,
  );
}

/**
 * Answer every matching API write from here on with a 503, as the API would
 * while down.
 *
 * The API is cross-origin, so the 503 needs its own CORS header; without it
 * the app sees a network error instead of the API's response.
 */
export async function rejectApiWrite(
  page: Page,
  method: string,
  pathFragment: string,
): Promise<void> {
  const status = 503;

  await page.route(
    () => true,
    (route) =>
      isApiWrite(route.request(), method, pathFragment)
        ? route.fulfill({
            status,
            contentType: 'application/problem+json',
            headers: { 'Access-Control-Allow-Origin': new URL(page.url()).origin },
            body: JSON.stringify({
              type: 'about:blank',
              title: 'Service Unavailable',
              status,
              detail: 'Injected by the end-to-end suite.',
            }),
          })
        : route.fallback(),
  );
}

function isApiWrite(request: Request, method: string, pathFragment: string): boolean {
  return request.method() === method && request.url().includes(pathFragment);
}

/** The emulator account `persona` signs in as; each persona in a test gets its own. */
function account(persona: string): { email: string; displayName: string } {
  // Identifies the attempt, not the test: retrying against the same account
  // would inherit the Firestore documents the failed attempt left behind.
  const { testId, retry } = base.info();
  const id = `${testId}-${retry}-${persona}`;

  return { email: `e2e.${id}@example.com`, displayName: `E2E Traveler ${id}` };
}

/**
 * Sign in through the Firebase Auth emulator's Google provider screen.
 *
 * Every test gets its own emulator accounts, so signed-in specs never share
 * Firestore documents. The screen is the one the Firebase CLI serves at
 * /emulator/auth/handler; its controls carry no accessible names, hence the ids.
 */
export async function signIn(page: Page, persona = 'traveler'): Promise<void> {
  const { email, displayName } = account(persona);

  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Sign in' }).click();
  const popup = await popupPromise;

  // The emulator wires its controls up in a script that runs after load, so a
  // click that waited only for the element to exist is a silent no-op.
  await popup.waitForLoadState('load');
  await popup.getByRole('button', { name: 'Add new account' }).click();

  const emailInput = popup.locator('#email-input');
  await expect(emailInput).toBeVisible();
  await emailInput.fill(email);
  await popup.locator('#display-name-input').fill(displayName);
  await popup.locator('#sign-in').click();

  // The header switching over is the signal that the credential reached the
  // app; waiting on the popup closing races the message it still has to send.
  await expect(page.getByRole('button', { name: displayName })).toBeVisible();
}

/** Sign `persona` out through the header's account menu. */
export async function signOut(page: Page, persona = 'traveler'): Promise<void> {
  await page.getByRole('button', { name: account(persona).displayName }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
}

/** Put a character in the signed-in collection via the UI, server write included. */
export async function collectCharacter(page: Page, character: Character): Promise<void> {
  await page.goto('/characters');

  await withApiWrite(page, 'PUT', apiPath.character(character), () =>
    page.getByRole('button', { name: addCharacterLabel(character) }).click(),
  );

  await expect(page.getByRole('button', { name: removeCharacterLabel(character) })).toBeVisible();
}

/**
 * Put one instance of a weapon in the signed-in collection via the UI.
 *
 * Opening a weapon the collection does not hold yet auto-creates its first
 * instance, so selecting the card is the whole interaction.
 */
export async function collectWeapon(page: Page, weapon: Weapon): Promise<void> {
  await page.goto('/weapons');

  await withApiWrite(page, 'POST', apiPath.weapons, () =>
    page.getByRole('button', { name: weaponCardLabel(weapon, 0) }).click(),
  );

  // The instance sheet the card opens is modal, hiding the grid behind it from
  // the accessibility tree — the card's own "1 owned" label is unreachable
  // until the sheet closes.
  await expect(page.getByRole('dialog', { name: weapon.name })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove instance 1' })).toBeVisible();
}

/** Dismiss the weapon instance sheet and wait for the grid to come back. */
export async function closeWeaponSheet(page: Page, weapon: Weapon): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: weapon.name })).toBeHidden();
}

/** `signedInPage` is a page already signed in to a fresh emulator account. */
export const test = base.extend<{ signedInPage: Page }>({
  signedInPage: async ({ page }, use) => {
    await page.goto('/');
    await signIn(page);
    await use(page);
  },
});

export { expect };
