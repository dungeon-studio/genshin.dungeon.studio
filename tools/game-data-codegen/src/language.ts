// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import genshinDb from 'genshin-db';

/**
 * Pins queries and results to English.
 *
 * Ids and display names are derived from the returned strings, so a generator
 * that inherited another language would rewrite every id in its roster.
 */
export function queryInEnglish(): void {
  genshinDb.setOptions({
    queryLanguages: [genshinDb.Language.English],
    resultLanguage: genshinDb.Language.English,
  });
}
