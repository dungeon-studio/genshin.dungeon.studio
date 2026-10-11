// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { FIRST_BANNER_DATES } from './first-banner-dates.generated.js';

/**
 * Launch characters are dated to release day: the standard pool had them from
 * the start, so the first banner featuring them, if any, came later.
 */
const LAUNCH = { version: '1.0', date: '2020-09-28' };

/** Resolves a character's ISO 8601 debut date from its id and genshin-db version. */
export type DebutDate = (id: string, version: string) => string;

/**
 * Date each character by the first banner featuring them, keyed by roster id.
 *
 * @throws Error, from the returned function, naming a post-launch character
 *   no banner features.
 */
export function debutDates(firstBanner: Readonly<Record<string, string>>): DebutDate {
  return (id, version) => {
    if (version === LAUNCH.version) return LAUNCH.date;

    const date = firstBanner[id];
    if (!date) {
      throw new Error(
        `No banner features "${id}"; regenerate with \`generate first-banner-dates\``,
      );
    }
    return date;
  };
}

/** Debut dates from the generated first-banner table. */
export const debutDate: DebutDate = debutDates(FIRST_BANNER_DATES);
