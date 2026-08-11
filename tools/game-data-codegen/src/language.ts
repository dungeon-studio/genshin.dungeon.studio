// SPDX-FileCopyrightText: 2026 Alex Brandt <alunduil@gmail.com>
// SPDX-License-Identifier: MIT

import genshinDb from 'genshin-db';

/**
 * Ids and display names derive from the strings genshin-db returns, so a
 * generator that inherited another language would rewrite every id it emits.
 */
export function queryInEnglish(): void {
  genshinDb.setOptions({
    queryLanguages: [genshinDb.Language.English],
    resultLanguage: genshinDb.Language.English,
  });
}
