// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Character, Element } from '@genshin/game-data';
import { CHARACTER_ROSTER, ELEMENTAL_RESONANCES } from '@genshin/game-data';

import { apiPath, collectCharacter, expect, test, withApiWrite } from './fixtures';

const TEAM_SLOT = 1;

function charactersOf(element: Element, count: number): Character[] {
  const found = CHARACTER_ROSTER.filter((character) => character.element === element).slice(
    0,
    count,
  );
  if (found.length < count)
    throw new Error(`Game data has fewer than ${count} ${element} characters.`);
  return found;
}

// Three distinct elements, so the pair is the only resonance in play; four
// would add Protective Canopy.
const party = [...charactersOf('Pyro', 2), ...charactersOf('Hydro', 1), ...charactersOf('Cryo', 1)];
const resonance = ELEMENTAL_RESONANCES['fervent-flames'];

test('a full team shows its resonance and what it grants', async ({ signedInPage: page }) => {
  for (const character of party) await collectCharacter(page, character);

  await page.goto('/');

  const team = page.getByRole('region', { name: `Team ${TEAM_SLOT}` });
  await team.getByRole('button').filter({ hasText: 'No character' }).first().click();

  const editor = page.getByRole('dialog');
  const badge = (scope: typeof page | typeof editor) =>
    scope.getByRole('button', { name: resonance.name });

  for (const [i, character] of party.entries()) {
    if (i > 0) {
      await editor.getByRole('button', { name: `Select empty member position ${i + 1}` }).click();
    }

    // Resonance needs the whole party, so the badge waits for the last member.
    await expect(badge(editor)).toHaveCount(0);

    await withApiWrite(page, 'PUT', apiPath.team(TEAM_SLOT), () =>
      page.getByRole('button', { name: `Add ${character.name} to team` }).click(),
    );
  }

  await expect(badge(editor)).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(editor).toBeHidden();

  await badge(team).click();
  await expect(page.getByText(resonance.description)).toBeVisible();
});
