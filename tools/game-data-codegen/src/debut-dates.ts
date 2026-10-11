// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import type { Banner } from './paimon-moe.js';
import { characterBanners } from './paimon-moe.js';
import { toKebabCase } from './slug.js';

/**
 * Launch characters are dated to release day: the standard pool had them from
 * the start, so their first rate-up banner, if any, came later.
 */
const LAUNCH = { version: '1.0', date: '2020-09-28' };

/** Resolves a character's ISO 8601 debut date from its id and genshin-db version. */
export type DebutDate = (id: string, version: string) => string;

/** The start date of the first banner rating up each character, by roster id. */
function firstRateUps(banners: readonly Banner[]): Map<string, string> {
  const firstRateUp = new Map<string, string>();
  for (const banner of banners) {
    const date = banner.start.slice(0, 'YYYY-MM-DD'.length);
    for (const name of [...banner.featured, ...banner.featuredRare]) {
      const id = toKebabCase(name);
      const known = firstRateUp.get(id);
      if (!known || date < known) firstRateUp.set(id, date);
    }
  }
  return firstRateUp;
}

/**
 * Date each character by the start of the first banner that rates them up,
 * featured or four-star, falling back to release day for launch characters.
 *
 * @throws Error, from the returned function, naming a post-launch character no
 *   banner rates up.
 */
export function debutDates(banners: readonly Banner[]): DebutDate {
  const firstRateUp = firstRateUps(banners);

  return (id, version) => {
    if (version === LAUNCH.version) return LAUNCH.date;

    const date = firstRateUp.get(id);
    if (!date) {
      throw new Error(
        `No banner in the paimon-moe snapshot rates up "${id}"; refresh it with \`fetch-banners\``,
      );
    }
    return date;
  };
}

/** Debut dates from the vendored paimon-moe snapshot. */
export const debutDate: DebutDate = debutDates(characterBanners);
