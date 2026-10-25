// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type {
  Character,
  ARTIFACT_MINOR_AFFIXES,
  CIRCLET_MAIN_AFFIXES,
  GOBLET_MAIN_AFFIXES,
  SANDS_MAIN_AFFIXES,
} from '@genshin/game-data';
import { ARTIFACT_PIECES, ARTIFACT_SETS, CHARACTER_ROSTER } from '@genshin/game-data';
import type { Locator, Page } from '@playwright/test';

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

const [secondCharacter, thirdCharacter] = CHARACTER_ROSTER.filter(
  (candidate) => candidate.id !== character.id,
);
if (!secondCharacter || !thirdCharacter)
  throw new Error('Game data has fewer than three characters.');

const TEAM_SLOT = 1;
const TEAM_NAME = 'Vaporise';

const SANDS = 'Energy Recharge' satisfies (typeof SANDS_MAIN_AFFIXES)[number];
const GOBLET = 'Pyro DMG Bonus' satisfies (typeof GOBLET_MAIN_AFFIXES)[number];
const CIRCLET = 'CRIT Rate' satisfies (typeof CIRCLET_MAIN_AFFIXES)[number];
const SUBSTAT = 'CRIT DMG' satisfies (typeof ARTIFACT_MINOR_AFFIXES)[number];
const ARTIFACT_SET = ARTIFACT_SETS['obsidian-codex'];

/** A team still under its default name, `Team <slot>`. */
function unnamedTeam(page: Page, slot: number): Locator {
  return page.getByRole('region', { name: `Team ${slot}` });
}

/** `label` is a member's name, or "No character" for an empty position. */
function memberPosition(team: Locator, label: string): Locator {
  return team.getByRole('button').filter({ hasText: label }).first();
}

/**
 * Every save sends the whole team, so a save left unawaited can land after a
 * newer one and undo it.
 */
function saveTeam(page: Page, slot: number, edit: () => Promise<unknown>): Promise<void> {
  return withApiWrite(page, 'PUT', apiPath.team(slot), edit);
}

/** Dismiss the member editor sheet and wait for the teams to come back. */
async function closeTeamEditor(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
}

/** Fill the first empty position of `slot` with `member` and close the editor. */
async function addMember(page: Page, slot: number, member: Character): Promise<void> {
  await memberPosition(unnamedTeam(page, slot), 'No character').click();

  await saveTeam(page, slot, () =>
    page.getByRole('button', { name: `Add ${member.name} to team` }).click(),
  );

  await closeTeamEditor(page);
}

// Collections are sign-in-only, so the pools are empty signed out and the whole
// flow runs signed in.

test('a team takes a name, a character, and a weapon that survive a reload', async ({
  signedInPage: page,
}) => {
  await collectCharacter(page, character);
  await collectWeapon(page, weapon);

  await page.goto('/');

  await saveTeam(page, TEAM_SLOT, async () => {
    await page.getByRole('button', { name: `Edit name of Team ${TEAM_SLOT}` }).click();
    const nameField = page.getByRole('textbox', { name: `Rename team ${TEAM_SLOT}` });
    await nameField.fill(TEAM_NAME);
    await nameField.press('Enter');
  });

  const team = page.getByRole('region', { name: TEAM_NAME });
  await expect(team).toBeVisible();

  await memberPosition(team, 'No character').click();

  await saveTeam(page, TEAM_SLOT, () =>
    page.getByRole('button', { name: `Add ${character.name} to team` }).click(),
  );

  await page.getByRole('button', { name: 'Weapons' }).click();

  await saveTeam(page, TEAM_SLOT, () =>
    page.getByRole('button', { name: `Assign ${weapon.name} to character` }).click(),
  );

  await closeTeamEditor(page);

  await expect(team.getByText(character.name)).toBeVisible();
  await expect(team.getByText(weapon.name)).toBeVisible();

  await page.reload();

  const reloaded = page.getByRole('region', { name: TEAM_NAME });
  await expect(reloaded.getByText(character.name)).toBeVisible();
  await expect(reloaded.getByText(weapon.name)).toBeVisible();
});

test('the other team slots keep their own members through a reload', async ({
  signedInPage: page,
}) => {
  const members = new Map([
    [2, character],
    [3, secondCharacter],
    [4, thirdCharacter],
  ]);

  for (const member of members.values()) await collectCharacter(page, member);

  await page.goto('/');
  for (const [slot, member] of members) await addMember(page, slot, member);

  await page.reload();

  for (const [slot, member] of members) {
    await expect(unnamedTeam(page, slot).getByText(member.name)).toBeVisible();
  }
});

test('a removed member stays removed through a reload', async ({ signedInPage: page }) => {
  await collectCharacter(page, character);
  await collectCharacter(page, secondCharacter);

  await page.goto('/');
  await addMember(page, TEAM_SLOT, character);
  await addMember(page, TEAM_SLOT, secondCharacter);

  const team = unnamedTeam(page, TEAM_SLOT);
  await memberPosition(team, character.name).click();

  await saveTeam(page, TEAM_SLOT, () =>
    page.getByRole('button', { name: `Remove ${character.name} from team` }).click(),
  );

  await closeTeamEditor(page);

  await page.reload();

  // The remaining member proves the team has loaded, so the absence check
  // can't pass on an empty page.
  await expect(team.getByText(secondCharacter.name)).toBeVisible();
  await expect(team.getByText(character.name)).toBeHidden();
});

test('an artifact plan survives a reload', async ({ signedInPage: page }) => {
  await collectCharacter(page, character);

  await page.goto('/');
  await addMember(page, TEAM_SLOT, character);

  const team = unnamedTeam(page, TEAM_SLOT);
  const sands = team.getByRole('combobox', { name: ARTIFACT_PIECES.SANDS });
  const goblet = team.getByRole('combobox', { name: ARTIFACT_PIECES.GOBLET });
  const circlet = team.getByRole('combobox', { name: ARTIFACT_PIECES.CIRCLET });
  const artifactSet = team.getByRole('combobox', { name: 'Search artifact set...' });
  const prioritySubstats = team.getByRole('list', { name: 'Priority substats' });

  const save = (edit: () => Promise<unknown>) => saveTeam(page, TEAM_SLOT, edit);

  await save(() => sands.selectOption(SANDS));
  await save(() => goblet.selectOption(GOBLET));
  await save(() => circlet.selectOption(CIRCLET));
  await save(async () => {
    await artifactSet.click();
    await page.getByRole('option', { name: ARTIFACT_SET.name }).click();
  });
  await save(() =>
    team.getByRole('combobox', { name: 'Add priority substats' }).selectOption(SUBSTAT),
  );

  await page.reload();

  await expect(sands).toHaveValue(SANDS);
  await expect(goblet).toHaveValue(GOBLET);
  await expect(circlet).toHaveValue(CIRCLET);
  await expect(artifactSet).toHaveText(ARTIFACT_SET.name);
  await expect(prioritySubstats.getByRole('listitem')).toHaveText([SUBSTAT]);
});
