// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Rarity } from '@genshin/game-data';
import { CHARACTER_ROSTER, WEAPON_ROSTER } from '@genshin/game-data';
import type { Page } from '@playwright/test';

import {
  closeWeaponSheet,
  collectCharacter,
  collectWeapon,
  equippablePair,
  expect,
  test,
} from './fixtures';

interface CollectionItem {
  name: string;
  rarity: Rarity;
}

/** One collection page, described by what its shared filter bar acts on. */
interface CollectionPage<I extends CollectionItem> {
  noun: string;
  path: string;
  roster: readonly I[];
  /** The value the page's category chips filter on: element or weapon type. */
  category: (item: I) => string;
  /** Captures the item name from a card's accessible name, owned or not. */
  cardName: RegExp;
  collect: (page: Page, item: I) => Promise<void>;
  sample: I;
}

const RARITY: Rarity = 4;

// The collator the app sorts names with.
const nameCollator = new Intl.Collator('en');

/** Card names in the order the grid renders them. */
async function renderedNames(page: Page, cardName: RegExp): Promise<string[]> {
  const labels = await page
    .getByRole('button', { name: cardName })
    .evaluateAll((cards) => cards.map((card) => card.getAttribute('aria-label') ?? ''));

  return labels.map((label) => cardName.exec(label)?.[1] ?? label);
}

function describeFilters<I extends CollectionItem>(collection: CollectionPage<I>): void {
  const { noun, path, roster, category, cardName, collect, sample } = collection;
  const names = (page: Page) => renderedNames(page, cardName);

  /** The grid settles on exactly the roster items `matches` keeps, in any order. */
  const expectGridOf = (page: Page, matches: (item: I) => boolean) =>
    expect
      .poll(async () => (await names(page)).toSorted())
      .toEqual(
        roster
          .filter(matches)
          .map((item) => item.name)
          .toSorted(),
      );

  test.describe(`the ${noun} filters`, () => {
    test('search narrows the grid to matching names', async ({ page }) => {
      await page.goto(path);

      await page.getByRole('searchbox').fill(sample.name);

      const query = sample.name.toLowerCase();
      await expectGridOf(page, (item) => item.name.toLowerCase().includes(query));
    });

    test('a rarity chip narrows the grid to that rarity', async ({ page }) => {
      await page.goto(path);

      await page.getByRole('button', { name: `Filter by ${RARITY}-star` }).click();

      await expectGridOf(page, (item) => item.rarity === RARITY);
    });

    test('a category chip narrows the grid to that category', async ({ page }) => {
      await page.goto(path);

      const value = category(sample);
      await page.getByRole('button', { name: `Filter by ${value}` }).click();

      await expectGridOf(page, (item) => category(item) === value);
    });

    test('the ownership chips split owned from unowned', async ({ signedInPage: page }) => {
      await collect(page, sample);

      await page.getByRole('button', { name: /^owned$/i }).click();
      await expect.poll(() => names(page)).toEqual([sample.name]);

      await page.getByRole('button', { name: /^unowned$/i }).click();
      await expectGridOf(page, (item) => item !== sample);
    });

    test('the direction control reverses the order', async ({ page }) => {
      await page.goto(path);
      await expect.poll(async () => (await names(page)).length).toBe(roster.length);
      const before = await names(page);

      await page
        .getByRole('button', { name: 'Sort order: descending, switch to ascending' })
        .click();

      await expect.poll(() => names(page)).toEqual(before.toReversed());
    });

    test('the field control switches to name order', async ({ page }) => {
      await page.goto(path);

      await page.getByRole('button', { name: 'Sort by: Release, switch to Name' }).click();

      await expect(
        page.getByRole('button', { name: 'Sort by: Name, switch to Release' }),
      ).toBeVisible();
      await expect
        .poll(() => names(page))
        .toEqual(roster.map((item) => item.name).toSorted((a, b) => nameCollator.compare(b, a)));
    });
  });
}

const { character, weapon } = equippablePair();

describeFilters({
  noun: 'character',
  path: '/characters',
  roster: CHARACTER_ROSTER,
  category: (item) => item.element,
  cardName: /^(?:Add|Remove) (.+) (?:to|from) collection$/,
  collect: collectCharacter,
  sample: character,
});

describeFilters({
  noun: 'weapon',
  path: '/weapons',
  roster: WEAPON_ROSTER,
  category: (item) => item.type,
  cardName: /^(?:Add )?(.+?)(?: to collection|, \d+ owned)$/,
  collect: async (page, item) => {
    await collectWeapon(page, item);
    await closeWeaponSheet(page, item);
  },
  sample: weapon,
});
