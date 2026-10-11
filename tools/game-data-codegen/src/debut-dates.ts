// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { writeFile } from 'node:fs/promises';

import type { Banner } from '../vendor/paimon-moe/banners.js';
import { banners } from '../vendor/paimon-moe/banners.js';

const UPSTREAM_BANNERS =
  'https://raw.githubusercontent.com/MadeBaruna/paimon-moe/main/src/data/banners.js';

const BANNER_SNAPSHOT = new URL('../vendor/paimon-moe/banners.js', import.meta.url);

/**
 * Launch characters are dated to release day: the standard pool had them from
 * the start, so their first rate-up banner, if any, came later.
 */
const LAUNCH = { version: '1.0', date: '2020-09-28' };

/** Resolves a character's ISO 8601 debut date from its id and genshin-db version. */
export type DebutDate = (id: string, version: string) => string;

/**
 * Date each character by the start of the first banner that rates them up,
 * featured or four-star, falling back to release day for launch characters.
 *
 * @throws Error, from the returned function, naming a post-launch character no
 *   banner rates up.
 */
export function debutDates(characterBanners: readonly Banner[]): DebutDate {
  const firstBanner = new Map<string, string>();
  for (const banner of characterBanners) {
    const date = banner.start.slice(0, 'YYYY-MM-DD'.length);
    for (const name of [...banner.featured, ...banner.featuredRare]) {
      const id = name.replaceAll('_', '-');
      const known = firstBanner.get(id);
      if (!known || date < known) firstBanner.set(id, date);
    }
  }

  return (id, version) => {
    if (version === LAUNCH.version) return LAUNCH.date;

    const date = firstBanner.get(id);
    if (!date) {
      throw new Error(
        `No banner in the paimon-moe snapshot rates up "${id}"; refresh it with \`fetch-banners\``,
      );
    }
    return date;
  };
}

/** Debut dates from the vendored paimon-moe snapshot. */
export const debutDate: DebutDate = debutDates(banners.characters);

/** Replace the vendored snapshot with paimon-moe's current banner data. */
export async function fetchBanners(): Promise<void> {
  const response = await fetch(UPSTREAM_BANNERS);
  if (!response.ok) {
    throw new Error(
      `Fetching ${UPSTREAM_BANNERS} failed: ${response.status} ${response.statusText}`,
    );
  }
  await writeFile(BANNER_SNAPSHOT, await response.text());
}
