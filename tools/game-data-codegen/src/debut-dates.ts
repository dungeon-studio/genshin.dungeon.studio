// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import { FIRST_RATE_UP_DATES } from './rate-up-dates.generated.js';

/**
 * Launch characters are dated to release day: the standard pool had them from
 * the start, so their first rate-up banner, if any, came later.
 */
const LAUNCH = { version: '1.0', date: '2020-09-28' };

/** Resolves a character's ISO 8601 debut date from its id and genshin-db version. */
export type DebutDate = (id: string, version: string) => string;

/**
 * Date each character by their first rate-up banner, keyed by roster id.
 *
 * @throws Error, from the returned function, naming a post-launch character
 *   with no rate-up date.
 */
export function debutDates(firstRateUp: Readonly<Record<string, string>>): DebutDate {
  return (id, version) => {
    if (version === LAUNCH.version) return LAUNCH.date;

    const date = firstRateUp[id];
    if (!date) {
      throw new Error(`No rate-up date for "${id}"; refresh them with \`generate rate-up-dates\``);
    }
    return date;
  };
}

/** Debut dates from the generated rate-up table. */
export const debutDate: DebutDate = debutDates(FIRST_RATE_UP_DATES);
